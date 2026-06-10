import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import type { ParkingLotDisplayType } from "@/src/api-contracts";

// Types for parking markers on the map
export interface ParkingMarker {
  id: string;
  lat: number;
  lng: number;
  type: "pending" | "completed";
  label?: string;
  /** Marker mode: "new" = create new survey (yellow #f59b0b), "existing" = edit existing */
  mode?: "new" | "existing";
  /** Parking lot type - determines marker shape and color */
  parkingType?: ParkingLotDisplayType;
  /** Whether this marker has been manually updated — renders as solid blue (#072AC8) */
  isUpdated?: boolean;
  /** Whether this marker was created via app field survey — always renders as green (#10A571) */
  isCreatedByApp?: boolean;
  /** Whether this marker has been confirmed/completed by surveyor / 조사 확인 완료 여부 */
  isConfirmed?: boolean;
  /** Parking lot name */
  parkingName?: string | null;
  /** Total parking spaces */
  totalSpaces?: number | null;
  /** Address */
  address?: string | null;
  /** Pre-derived survey area code (조사구역) for create mode — fills uniqueNumber1 */
  surveyArea?: string | null;
}

export interface KakaoMapRef {
  moveToLocation: (lat: number, lng: number) => void;
  /** Move map so target is in upper portion, offset down by given pixels */
  moveToLocationWithOffset: (lat: number, lng: number, offsetY: number) => void;
  setMarkers: (markers: ParkingMarker[]) => void;
  getCurrentLocation: () => void;
  selectMarker: (markerId: string) => void;
  /** Select marker with known coordinates (no lookup needed) */
  selectMarkerAt: (markerId: string, lat: number, lng: number, markerType?: string) => void;
  deselectMarker: () => void;
  setBottomSheetVisible: (visible: boolean) => void;
  /** Filter visible markers by parking type */
  setVisibleTypes: (types: string[]) => void;
  /** Enable/disable adding mode (map tap places a new marker) */
  setAddingMode: (enabled: boolean) => void;
  /** Remove the temporary new marker from map */
  clearNewMarker: () => void;
  /** Set zone boundary polygons to display on map */
  setZonePolygons: (polygons: Array<{ coords: [number, number][]; displayName?: string }>) => void;
  /** Show or hide zone number labels on map */
  setZoneLabelsVisible: (visible: boolean) => void;
  /** Fit map viewport to given bounds with padding */
  fitBounds: (swLat: number, swLng: number, neLat: number, neLng: number) => void;
  /** Place a search result marker (teardrop pin) at the given location */
  setSearchMarker: (lat: number, lng: number, address: string) => void;
  /** Remove the search result marker from map */
  clearSearchMarker: () => void;
}

// Map viewport bounds
export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

interface KakaoMapProps {
  appKey: string;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  markers?: ParkingMarker[];
  onMarkerPress?: (marker: ParkingMarker) => void;
  onMapReady?: () => void;
  onLocationReceived?: (lat: number, lng: number) => void;
  onBoundsChanged?: (bounds: MapBounds) => void;
  /** Called immediately when user taps the map in adding mode (before reverse geocoding) */
  onMapTapStart?: () => void;
  /** Called when user taps an empty map area in adding mode (after reverse geocoding completes) */
  onMapTap?: (lat: number, lng: number, address?: string) => void;
  /** Called when user taps the close button on the search result marker */
  onSearchMarkerClose?: () => void;
  style?: ViewStyle;
}

/**
 * KakaoMap component using WebView
 * Displays a Kakao Map with parking location markers
 */
export const KakaoMap = forwardRef<KakaoMapRef, KakaoMapProps>(
  (
    {
      appKey,
      initialLat = 37.5665,
      initialLng = 126.978,
      initialZoom = 3,
      markers = [],
      onMarkerPress,
      onMapReady,
      onLocationReceived,
      onBoundsChanged,
      onMapTapStart,
      onMapTap,
      onSearchMarkerClose,
      style,
    },
    ref
  ) => {
    const webViewRef = useRef<WebView>(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      moveToLocation: (lat: number, lng: number) => {
        webViewRef.current?.injectJavaScript(`
          if (window.kakaoMap) {
            window.kakaoMap.setCenter(new kakao.maps.LatLng(${lat}, ${lng}));
          }
          true;
        `);
      },
      moveToLocationWithOffset: (lat: number, lng: number, offsetY: number) => {
        webViewRef.current?.injectJavaScript(`
          if (window.kakaoMap) {
            if (window.kakaoMap.getLevel() > 6) window.kakaoMap.setLevel(4);
            window.kakaoMap.setCenter(new kakao.maps.LatLng(${lat}, ${lng}));
            window.kakaoMap.panBy(0, ${offsetY});
          }
          true;
        `);
      },
      setMarkers: (newMarkers: ParkingMarker[]) => {
        webViewRef.current?.injectJavaScript(`
          if (window.setMarkers) {
            window.setMarkers(${JSON.stringify(newMarkers)});
          }
          true;
        `);
      },
      getCurrentLocation: () => {
        webViewRef.current?.injectJavaScript(`
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'location',
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                }));
              },
              (error) => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'locationError',
                  error: error.message
                }));
              }
            );
          }
          true;
        `);
      },
      selectMarker: (markerId: string) => {
        webViewRef.current?.injectJavaScript(`
          if (window.selectMarker) {
            window.selectMarker('${markerId}');
          }
          true;
        `);
      },
      selectMarkerAt: (markerId: string, lat: number, lng: number, markerType?: string) => {
        webViewRef.current?.injectJavaScript(`
          if (window.selectMarkerAt) {
            window.selectMarkerAt('${markerId}', ${lat}, ${lng}, '${markerType || 'building'}');
          }
          true;
        `);
      },
      deselectMarker: () => {
        webViewRef.current?.injectJavaScript(`
          if (window.deselectMarker) {
            window.deselectMarker();
          }
          true;
        `);
      },
      setBottomSheetVisible: (visible: boolean) => {
        webViewRef.current?.injectJavaScript(`
          if (window.setBottomSheetVisible) {
            window.setBottomSheetVisible(${visible});
          }
          true;
        `);
      },
      setVisibleTypes: (types: string[]) => {
        webViewRef.current?.injectJavaScript(`
          if (window.setVisibleTypes) {
            window.setVisibleTypes(${JSON.stringify(types)});
          }
          true;
        `);
      },
      setAddingMode: (enabled: boolean) => {
        webViewRef.current?.injectJavaScript(`
          if (window.setAddingMode) {
            window.setAddingMode(${enabled});
          }
          true;
        `);
      },
      clearNewMarker: () => {
        webViewRef.current?.injectJavaScript(`
          if (window.clearNewMarker) {
            window.clearNewMarker();
          }
          true;
        `);
      },
      setZonePolygons: (polygons: Array<{ coords: [number, number][]; displayName?: string }>) => {
        webViewRef.current?.injectJavaScript(`
          if (window.setZonePolygons) {
            window.setZonePolygons(${JSON.stringify(polygons)});
          }
          true;
        `);
      },
      setZoneLabelsVisible: (visible: boolean) => {
        webViewRef.current?.injectJavaScript(`
          if (window.setZoneLabelsVisible) {
            window.setZoneLabelsVisible(${visible});
          }
          true;
        `);
      },
      fitBounds: (swLat: number, swLng: number, neLat: number, neLng: number) => {
        webViewRef.current?.injectJavaScript(`
          if (window.kakaoMap) {
            var bounds = new kakao.maps.LatLngBounds(
              new kakao.maps.LatLng(${swLat}, ${swLng}),
              new kakao.maps.LatLng(${neLat}, ${neLng})
            );
            window.kakaoMap.setBounds(bounds, 50, 50, 50, 50);
          }
          true;
        `);
      },
      setSearchMarker: (lat: number, lng: number, address: string) => {
        webViewRef.current?.injectJavaScript(`
          if (window.setSearchMarker) {
            window.setSearchMarker(${lat}, ${lng}, ${JSON.stringify(address)});
          }
          true;
        `);
      },
      clearSearchMarker: () => {
        webViewRef.current?.injectJavaScript(`
          if (window.clearSearchMarker) {
            window.clearSearchMarker();
          }
          true;
        `);
      },
    }));

    // Handle messages from WebView
    const handleMessage = (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case "markerClick":
            onMarkerPress?.(data.marker);
            break;
          case "mapReady":
            onMapReady?.();
            break;
          case "location":
            onLocationReceived?.(data.lat, data.lng);
            break;
          case "boundsChanged":
            onBoundsChanged?.(data.bounds);
            break;
          case "mapTapStart":
            onMapTapStart?.();
            break;
          case "mapTap":
            onMapTap?.(data.lat, data.lng, data.address);
            break;
          case "searchMarkerClose":
            onSearchMarkerClose?.();
            break;
        }
      } catch {
        // Ignore parse errors
      }
    };

    // Generate HTML content for Kakao Map with canvas-based marker rendering
    const generateHTML = () => {
      const markersJSON = JSON.stringify(markers);

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #f0f0f0; }
    #map { width: 100%; height: 100%; }
    #error { padding: 20px; color: red; font-size: 14px; word-break: break-all; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="error"></div>
  <script>
    window.onerror = function(msg, url, line) {
      document.getElementById('error').innerHTML = 'Error: ' + msg + '<br>Line: ' + line;
      return false;
    };
  </script>
  <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false"></script>
  <script>
    var kakaoMap = null;
    var initialMarkers = ${markersJSON};

    // ── Marker style constants ──
    var MARKER_STYLES = {
      building:      { color: '#072AC8' },
      off_street:    { color: '#F59E0B' },
      on_street:     { color: '#10B981' },
      updated:       { color: '#072AC8' },  // Solid blue = existing data that has been updated
      createdByApp:  { color: '#10A571' }   // Green = newly created via app field survey
    };

    // Zoom threshold: level <= this shows individual markers, > shows clusters
    // Kakao levels: 1 = closest, 14 = furthest
    var CLUSTER_ZOOM_THRESHOLD = 6;

    // ── Canvas overlay state ──
    // Pre-split typed arrays for fast iteration (no object overhead per marker)
    var buildingArr = new Float64Array(0);  // [lat0,lng0, lat1,lng1, ...]
    var offStreetArr = new Float64Array(0);
    var onStreetArr = new Float64Array(0);
    // Updated markers rendered in solid blue (#072AC8) regardless of parking type
    var updatedArr = new Float64Array(0);
    // App-created markers rendered in solid green (#10A571) — always, even after update
    var createdByAppArr = new Float64Array(0);

    // Original marker objects for hit-testing (keyed by index within typed array)
    var buildingData = [];
    var offStreetData = [];
    var onStreetData = [];
    var updatedData = [];
    var createdByAppData = [];

    // Visibility flags per type
    var visibleTypes = { building: true, off_street: true, on_street: true };

    // Adding mode state: when true, map clicks place a new marker instead of hit-testing
    var isAddingMode = false;
    var newMarkerLat = null;
    var newMarkerLng = null;

    // Search marker state: teardrop pin placed when user selects a search result
    var searchMarkerLat = null;
    var searchMarkerLng = null;
    var searchMarkerAddress = '';
    var searchMarkerCalloutVisible = false; // Whether the address callout bubble is shown

    // Selection state
    var selectedMarkerId = null;
    var selectedMarkerLat = 0;
    var selectedMarkerLng = 0;
    var selectedMarkerType = null;
    var bottomSheetVisible = false;

    // Canvas overlay reference
    var canvasOverlay = null;
    var canvas = null;
    var ctx = null;

    // rAF throttle for marker rendering
    var markerRafId = 0;
    var markerDrawPending = false;

    // Cached canvas dimensions to avoid expensive resize
    var cachedCanvasW = 0;
    var cachedCanvasH = 0;

    try {
      if (typeof kakao === 'undefined') {
        document.getElementById('error').innerHTML = 'Kakao SDK not loaded. Check API key and domain settings.';
      } else {
        kakao.maps.load(function() {
          try {
            var container = document.getElementById('map');
            var options = {
              center: new kakao.maps.LatLng(${initialLat}, ${initialLng}),
              level: ${initialZoom}
            };

            kakaoMap = new kakao.maps.Map(container, options);
            window.kakaoMap = kakaoMap;

            // Create canvas overlays (zone canvas first so it renders below markers)
            createZoneCanvasOverlay();
            createCanvasOverlay();

            // Redraw on pan/zoom
            kakao.maps.event.addListener(kakaoMap, 'bounds_changed', function() {
              if (zoneOverlay && zoneOverlay.getMap()) zoneOverlay.draw();
              if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
            });

            // Notify React Native when viewport changes (fires after pan/zoom ends)
            kakao.maps.event.addListener(kakaoMap, 'idle', function() {
              var bounds = kakaoMap.getBounds();
              var sw = bounds.getSouthWest();
              var ne = bounds.getNorthEast();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'boundsChanged',
                bounds: {
                  swLat: sw.getLat(),
                  swLng: sw.getLng(),
                  neLat: ne.getLat(),
                  neLng: ne.getLng()
                }
              }));
            });

            // Hit-test on map click
            kakao.maps.event.addListener(kakaoMap, 'click', function(mouseEvent) {
              var latlng = mouseEvent.latLng;
              handleMapClick(latlng.getLat(), latlng.getLng());
            });

            // Set initial markers
            if (initialMarkers && initialMarkers.length > 0) {
              setMarkers(initialMarkers);
            }

            // Send initial bounds immediately so React can start fetching data
            // (idle event may not fire until user interacts with the map)
            var initBounds = kakaoMap.getBounds();
            var initSw = initBounds.getSouthWest();
            var initNe = initBounds.getNorthEast();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'boundsChanged',
              bounds: {
                swLat: initSw.getLat(),
                swLng: initSw.getLng(),
                neLat: initNe.getLat(),
                neLng: initNe.getLng()
              }
            }));

            // Notify map is ready
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
          } catch (e) {
            document.getElementById('error').innerHTML = 'Map init error: ' + e.message;
          }
        });
      }
    } catch (e) {
      document.getElementById('error').innerHTML = 'Load error: ' + e.message;
    }

    // ── Canvas overlay using AbstractOverlay (markers — rendered above zone canvas) ──
    function createCanvasOverlay() {
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '1';
      ctx = canvas.getContext('2d');

      canvasOverlay = new kakao.maps.AbstractOverlay();

      canvasOverlay.onAdd = function() {
        var panel = this.getPanels().overlayLayer;
        panel.appendChild(canvas);
      };

      canvasOverlay.onRemove = function() {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        if (markerRafId) { cancelAnimationFrame(markerRafId); markerRafId = 0; }
      };

      var overlayRef = canvasOverlay;

      canvasOverlay.draw = function() {
        var map = this.getMap();
        var total = buildingArr.length + offStreetArr.length + onStreetArr.length + updatedArr.length + createdByAppArr.length;
        if (!map || total === 0) {
          canvas.width = 0;
          canvas.height = 0;
          cachedCanvasW = 0;
          cachedCanvasH = 0;
          return;
        }

        var projection = this.getProjection();
        var bounds = map.getBounds();

        var nwLL = new kakao.maps.LatLng(
          bounds.getNorthEast().getLat(),
          bounds.getSouthWest().getLng()
        );
        var nwPt = projection.pointFromCoords(nwLL);

        var mapNode = map.getNode();
        var w = mapNode.offsetWidth;
        var h = mapNode.offsetHeight;

        // Position canvas at NW corner
        canvas.style.left = nwPt.x + 'px';
        canvas.style.top = nwPt.y + 'px';
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        // Schedule pixel work via rAF (coalesces multiple draw calls per frame)
        if (markerDrawPending) return;
        markerDrawPending = true;
        markerRafId = requestAnimationFrame(function() {
          markerDrawPending = false;
          actualDrawMarkers(overlayRef);
        });
      };

      canvasOverlay.setMap(kakaoMap);
    }

    // ── Actual marker pixel rendering (called via rAF) ──
    function actualDrawMarkers(overlay) {
      var map = overlay.getMap();
      if (!map) return;

      var projection = overlay.getProjection();
      var bounds = map.getBounds();
      var level = map.getLevel();

      var neLat = bounds.getNorthEast().getLat();
      var neLng = bounds.getNorthEast().getLng();
      var swLat = bounds.getSouthWest().getLat();
      var swLng = bounds.getSouthWest().getLng();

      var nwLL = new kakao.maps.LatLng(neLat, swLng);
      var seLL = new kakao.maps.LatLng(swLat, neLng);
      var nwPt = projection.pointFromCoords(nwLL);
      var sePt = projection.pointFromCoords(seLL);

      var mapNode = map.getNode();
      var w = mapNode.offsetWidth;
      var h = mapNode.offsetHeight;

      // Reposition canvas with fresh bounds
      canvas.style.left = nwPt.x + 'px';
      canvas.style.top = nwPt.y + 'px';
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      // Only resize canvas buffer when dimensions change (avoids expensive GPU realloc)
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var bufW = w * dpr;
      var bufH = h * dpr;
      if (cachedCanvasW !== bufW || cachedCanvasH !== bufH) {
        canvas.width = bufW;
        canvas.height = bufH;
        cachedCanvasW = bufW;
        cachedCanvasH = bufH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Linear interpolation: lat/lng → pixel (only 2 projections per frame)
      var pxPerLng = (sePt.x - nwPt.x) / (neLng - swLng);
      var pxPerLat = (sePt.y - nwPt.y) / (swLat - neLat);

      if (level <= CLUSTER_ZOOM_THRESHOLD) {
        renderIndividualMarkers(pxPerLng, pxPerLat, swLat, swLng, neLat, neLng, w, h);
      } else {
        renderClusters(pxPerLng, pxPerLat, swLat, swLng, neLat, neLng, w, h, level);
      }
    }

    // Force immediate draw bypassing rAF (for user interactions that need instant feedback)
    function forceDrawMarkers() {
      if (canvasOverlay && canvasOverlay.getMap()) {
        if (markerRafId) { cancelAnimationFrame(markerRafId); markerRafId = 0; }
        markerDrawPending = false;
        actualDrawMarkers(canvasOverlay);
      }
    }

    // ── Individual markers (zoomed in, level <= threshold) ──
    function renderIndividualMarkers(pxPerLng, pxPerLat, swLat, swLng, neLat, neLng, width, height) {
      ctx.clearRect(0, 0, width, height);

      var SIZE = 10;
      var HALF = SIZE / 2;
      var PAD = SIZE;

      // Helper: draw typed array as shapes, skipping the currently selected marker
      // outline: if true, draw white fill with colored border instead of solid fill
      function drawType(arr, color, shape, outline) {
        if (arr.length === 0) return;

        if (shape === 'sq') {
          var SQ_SIZE = 14;
          var SQ_HALF = SQ_SIZE / 2;
          var SQ_BR = 1.75;
          for (var i = 0; i < arr.length; i += 2) {
            var lat = arr[i], lng = arr[i + 1];
            if (selectedMarkerId !== null && lat === selectedMarkerLat && lng === selectedMarkerLng) continue;
            if (lat < swLat || lat > neLat || lng < swLng || lng > neLng) continue;
            var x = (lng - swLng) * pxPerLng;
            var y = (lat - neLat) * pxPerLat;
            if (x < -PAD || x > width + PAD || y < -PAD || y > height + PAD) continue;
            ctx.beginPath();
            ctx.roundRect(x - SQ_HALF, y - SQ_HALF, SQ_SIZE, SQ_SIZE, SQ_BR);
            if (outline) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fill();
              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              ctx.stroke();
            } else {
              ctx.fillStyle = color;
              ctx.fill();
            }
          }
        } else if (shape === 'tri') {
          ctx.beginPath();
          for (var i = 0; i < arr.length; i += 2) {
            var lat = arr[i], lng = arr[i + 1];
            if (selectedMarkerId !== null && lat === selectedMarkerLat && lng === selectedMarkerLng) continue;
            if (lat < swLat || lat > neLat || lng < swLng || lng > neLng) continue;
            var x = (lng - swLng) * pxPerLng;
            var y = (lat - neLat) * pxPerLat;
            if (x < -PAD || x > width + PAD || y < -PAD || y > height + PAD) continue;
            ctx.moveTo(x, y - HALF);
            ctx.lineTo(x - HALF, y + HALF);
            ctx.lineTo(x + HALF, y + HALF);
            ctx.lineTo(x, y - HALF);
          }
          ctx.fill();
        } else {
          ctx.beginPath();
          for (var i = 0; i < arr.length; i += 2) {
            var lat = arr[i], lng = arr[i + 1];
            if (selectedMarkerId !== null && lat === selectedMarkerLat && lng === selectedMarkerLng) continue;
            if (lat < swLat || lat > neLat || lng < swLng || lng > neLng) continue;
            var x = (lng - swLng) * pxPerLng;
            var y = (lat - neLat) * pxPerLat;
            if (x < -PAD || x > width + PAD || y < -PAD || y > height + PAD) continue;
            ctx.moveTo(x + HALF, y);
            ctx.arc(x, y, HALF, 0, Math.PI * 2);
          }
          ctx.fill();
        }
      }

      if (visibleTypes.building)   drawType(buildingArr,  MARKER_STYLES.building.color,   'sq', true);  // White bg + blue border
      if (visibleTypes.off_street) drawType(offStreetArr, MARKER_STYLES.off_street.color, 'tri');
      if (visibleTypes.on_street)  drawType(onStreetArr,  MARKER_STYLES.on_street.color,  'cir');
      // Updated markers always drawn on top in solid blue (sq shape)
      drawType(updatedArr, MARKER_STYLES.updated.color, 'sq');
      // App-created markers always drawn on top in solid green (sq shape)
      drawType(createdByAppArr, MARKER_STYLES.createdByApp.color, 'sq');

      // Draw selected marker LAST so it renders on top of all other markers
      if (selectedMarkerId !== null) {
        var sLat = selectedMarkerLat;
        var sLng = selectedMarkerLng;
        if (sLat >= swLat && sLat <= neLat && sLng >= swLng && sLng <= neLng) {
          var sx = (sLng - swLng) * pxPerLng;
          var sy = (sLat - neLat) * pxPerLat;
          var selColor = (selectedMarkerType && MARKER_STYLES[selectedMarkerType])
            ? MARKER_STYLES[selectedMarkerType].color : '#3B82F6';
          var SEL_SIZE = (selectedMarkerType === 'building' || selectedMarkerType === 'updated' || selectedMarkerType === 'createdByApp') ? 24 : 28;
          var SEL_HALF = SEL_SIZE / 2;

          if (selectedMarkerType === 'building') {
            var SEL_BR = 1.75;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(sx - SEL_HALF, sy - SEL_HALF, SEL_SIZE, SEL_SIZE, SEL_BR);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.strokeStyle = selColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else if (selectedMarkerType === 'updated' || selectedMarkerType === 'createdByApp') {
            var SEL_BR = 1.75;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = selColor;
            ctx.beginPath();
            ctx.roundRect(sx - SEL_HALF, sy - SEL_HALF, SEL_SIZE, SEL_SIZE, SEL_BR);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          } else if (selectedMarkerType === 'off_street') {
            ctx.beginPath();
            ctx.moveTo(sx, sy - SEL_HALF);
            ctx.lineTo(sx - SEL_HALF, sy + SEL_HALF);
            ctx.lineTo(sx + SEL_HALF, sy + SEL_HALF);
            ctx.closePath();
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = selColor;
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          } else {
            ctx.beginPath();
            ctx.arc(sx, sy, SEL_HALF, 0, Math.PI * 2);
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = selColor;
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }
        }
      }

      // Draw temporary new marker in adding mode (#10A571 green, rounded square with shadow)
      if (newMarkerLat !== null && newMarkerLng !== null) {
        var nx = (newMarkerLng - swLng) * pxPerLng;
        var ny = (newMarkerLat - neLat) * pxPerLat;
        var NEW_SIZE = 18;
        var NEW_HALF = NEW_SIZE / 2;
        var NEW_BR = 1.75;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#10A571';
        ctx.beginPath();
        ctx.roundRect(nx - NEW_HALF, ny - NEW_HALF, NEW_SIZE, NEW_SIZE, NEW_BR);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // Draw search marker: large teardrop pin with close button and optional address callout
      if (searchMarkerLat !== null && searchMarkerLng !== null) {
        var smx = (searchMarkerLng - swLng) * pxPerLng;
        var smy = (searchMarkerLat - neLat) * pxPerLat;

        // Teardrop pin parameters — tip anchored at (smx, smy)
        var PIN_R = 18;
        var PIN_TIP_Y = smy;
        var PIN_CENTER_Y = smy - PIN_R - 14;

        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;

        ctx.beginPath();
        ctx.arc(smx, PIN_CENTER_Y, PIN_R, Math.PI * 0.82, Math.PI * 0.18);
        ctx.lineTo(smx, PIN_TIP_Y);
        ctx.closePath();
        ctx.fillStyle = '#E74C3C';
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.beginPath();
        ctx.arc(smx, PIN_CENTER_Y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        var CLOSE_R = 9;
        var closeCx = smx + PIN_R * 0.7;
        var closeCy = PIN_CENTER_Y - PIN_R * 0.7;
        ctx.beginPath();
        ctx.arc(closeCx, closeCy, CLOSE_R, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.stroke();

        var xSize = 3.5;
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(closeCx - xSize, closeCy - xSize);
        ctx.lineTo(closeCx + xSize, closeCy + xSize);
        ctx.moveTo(closeCx + xSize, closeCy - xSize);
        ctx.lineTo(closeCx - xSize, closeCy + xSize);
        ctx.stroke();
        ctx.lineCap = 'butt';

        if (searchMarkerCalloutVisible && searchMarkerAddress) {
          ctx.font = '600 12px Pretendard, sans-serif';
          var addrText = searchMarkerAddress;
          var textW = ctx.measureText(addrText).width;
          var CALLOUT_PAD_H = 12;
          var CALLOUT_H = 28;
          var CALLOUT_W = textW + CALLOUT_PAD_H * 2;
          var CALLOUT_R = 6;
          var ARROW_H = 7;
          var calloutX = smx - CALLOUT_W / 2;
          var calloutY = PIN_CENTER_Y - PIN_R - ARROW_H - CALLOUT_H - 4;

          ctx.shadowColor = 'rgba(0,0,0,0.2)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;

          ctx.beginPath();
          ctx.roundRect(calloutX, calloutY, CALLOUT_W, CALLOUT_H, CALLOUT_R);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;

          ctx.strokeStyle = '#E0E0E0';
          ctx.lineWidth = 1;
          ctx.stroke();

          var arrowCx = smx;
          var arrowTopY = calloutY + CALLOUT_H;
          ctx.beginPath();
          ctx.moveTo(arrowCx - 5, arrowTopY);
          ctx.lineTo(arrowCx, arrowTopY + ARROW_H);
          ctx.lineTo(arrowCx + 5, arrowTopY);
          ctx.closePath();
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = '#E0E0E0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(arrowCx - 5, arrowTopY);
          ctx.lineTo(arrowCx, arrowTopY + ARROW_H);
          ctx.lineTo(arrowCx + 5, arrowTopY);
          ctx.stroke();

          ctx.fillStyle = '#333333';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(addrText, smx, calloutY + CALLOUT_H / 2);
          ctx.textAlign = 'start';
          ctx.textBaseline = 'alphabetic';
        }

        window._searchMarkerHit = {
          pinCx: smx, pinCy: PIN_CENTER_Y, pinR: PIN_R + 4,
          closeCx: closeCx, closeCy: closeCy, closeR: CLOSE_R + 4,
          tipX: smx, tipY: PIN_TIP_Y
        };
      } else {
        window._searchMarkerHit = null;
      }
    }

    // ── Cluster rendering (zoomed out, level > threshold) ──
    // Grid is computed in lat/lng space so clusters stay pinned to
    // fixed geographic positions regardless of panning.
    function renderClusters(pxPerLng, pxPerLat, swLat, swLng, neLat, neLng, width, height, level) {
      ctx.clearRect(0, 0, width, height);

      // Grid cell size in degrees — grows as we zoom out further
      // Increased base size so each cell covers a larger area (more markers per cluster)
      var gridLat = 0.018 * Math.pow(2, Math.max(0, level - CLUSTER_ZOOM_THRESHOLD - 1));
      var gridLng = 0.022 * Math.pow(2, Math.max(0, level - CLUSTER_ZOOM_THRESHOLD - 1));

      // Each type gets its own grid with unique offset to prevent overlap
      var configs = [
        { arr: buildingArr,     type: 'building',      oLat: 0,               oLng: 0,               visible: visibleTypes.building },
        { arr: offStreetArr,    type: 'off_street',    oLat: gridLat * 0.33,  oLng: gridLng * 0.17,  visible: visibleTypes.off_street },
        { arr: onStreetArr,     type: 'on_street',     oLat: gridLat * 0.67,  oLng: gridLng * 0.5,   visible: visibleTypes.on_street },
        { arr: updatedArr,      type: 'updated',       oLat: gridLat * 0.15,  oLng: gridLng * 0.35,  visible: true },
        { arr: createdByAppArr, type: 'createdByApp',  oLat: gridLat * 0.5,   oLng: gridLng * 0.65,  visible: true }
      ];

      var allClusters = [];

      // Expand viewport slightly so clusters near edges are included
      var padLat = gridLat;
      var padLng = gridLng;

      for (var c = 0; c < configs.length; c++) {
        var cfg = configs[c];
        if (!cfg.visible) continue;
        var grid = {};
        var arr = cfg.arr;
        for (var i = 0; i < arr.length; i += 2) {
          var lat = arr[i], lng = arr[i + 1];
          if (lat < swLat - padLat || lat > neLat + padLat || lng < swLng - padLng || lng > neLng + padLng) continue;

          var cellLat = Math.floor((lat + cfg.oLat) / gridLat);
          var cellLng = Math.floor((lng + cfg.oLng) / gridLng);
          var key = cellLat + ',' + cellLng;
          var cell = grid[key];
          if (cell) {
            cell.sumLat += lat;
            cell.sumLng += lng;
            cell.count++;
          } else {
            grid[key] = { sumLat: lat, sumLng: lng, count: 1, cellLat: cellLat, cellLng: cellLng };
          }
        }

        var keys = Object.keys(grid);
        for (var k = 0; k < keys.length; k++) {
          var cell = grid[keys[k]];
          var cLat = cell.sumLat / cell.count;
          var cLng = cell.sumLng / cell.count;
          // Convert centroid to pixel
          var cx = (cLng - swLng) * pxPerLng;
          var cy = (cLat - neLat) * pxPerLat;

          // Pseudo-random offset based on cell coords for organic placement
          var hash = ((cell.cellLat * 2654435761) ^ (cell.cellLng * 2246822519)) >>> 0;
          var offX = ((hash & 0xFF) / 255.0 - 0.5) * 12;
          var offY = (((hash >> 8) & 0xFF) / 255.0 - 0.5) * 10;

          allClusters.push({
            cx: cx + offX,
            cy: cy + offY,
            count: cell.count,
            parkingType: cfg.type
          });
        }
      }

      // Sort by Y so lower clusters are drawn on top
      allClusters.sort(function(a, b) { return a.cy - b.cy; });

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (var i = 0; i < allClusters.length; i++) {
        var cl = allClusters[i];
        // Smaller teardrop: reduced base radius and max cap
        var r = Math.min(9 + Math.log2(cl.count) * 1.8, 18);
        var tipY = cl.cy + r * 1.35;
        var clColor = MARKER_STYLES[cl.parkingType].color;
        // Existing (building) clusters: white fill + colored border + colored text
        var isOutline = (cl.parkingType === 'building');

        // Teardrop pin shape
        ctx.beginPath();
        ctx.arc(cl.cx, cl.cy, r, Math.PI * 0.82, Math.PI * 0.18);
        ctx.lineTo(cl.cx, tipY);
        ctx.closePath();
        ctx.fillStyle = isOutline ? '#FFFFFF' : clColor;
        ctx.fill();
        ctx.strokeStyle = isOutline ? clColor : '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Count label
        ctx.fillStyle = isOutline ? clColor : '#FFFFFF';
        ctx.font = 'bold ' + (r < 13 ? 8 : 10) + 'px sans-serif';
        var label = cl.count >= 1000 ? (cl.count / 1000).toFixed(1) + 'k' : String(cl.count);
        ctx.fillText(label, cl.cx, cl.cy);
      }

      // Draw search marker on top of clusters (same rendering as individual mode)
      // Tip anchored at smy (exact map coordinate), circle head above
      if (searchMarkerLat !== null && searchMarkerLng !== null) {
        var smx = (searchMarkerLng - swLng) * pxPerLng;
        var smy = (searchMarkerLat - neLat) * pxPerLat;
        var PIN_R = 18;
        var PIN_TIP_Y = smy;
        var PIN_CENTER_Y = smy - PIN_R - 14;

        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.arc(smx, PIN_CENTER_Y, PIN_R, Math.PI * 0.82, Math.PI * 0.18);
        ctx.lineTo(smx, PIN_TIP_Y);
        ctx.closePath();
        ctx.fillStyle = '#E74C3C';
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.beginPath();
        ctx.arc(smx, PIN_CENTER_Y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        var CLOSE_R = 9;
        var closeCx = smx + PIN_R * 0.7;
        var closeCy = PIN_CENTER_Y - PIN_R * 0.7;
        ctx.beginPath();
        ctx.arc(closeCx, closeCy, CLOSE_R, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.stroke();

        var xSize = 3.5;
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(closeCx - xSize, closeCy - xSize);
        ctx.lineTo(closeCx + xSize, closeCy + xSize);
        ctx.moveTo(closeCx + xSize, closeCy - xSize);
        ctx.lineTo(closeCx - xSize, closeCy + xSize);
        ctx.stroke();
        ctx.lineCap = 'butt';

        if (searchMarkerCalloutVisible && searchMarkerAddress) {
          ctx.font = '600 12px Pretendard, sans-serif';
          var addrText = searchMarkerAddress;
          var textW = ctx.measureText(addrText).width;
          var CALLOUT_PAD_H = 12;
          var CALLOUT_H = 28;
          var CALLOUT_W = textW + CALLOUT_PAD_H * 2;
          var CALLOUT_R = 6;
          var ARROW_H = 7;
          var calloutX = smx - CALLOUT_W / 2;
          var calloutY = PIN_CENTER_Y - PIN_R - ARROW_H - CALLOUT_H - 4;

          ctx.shadowColor = 'rgba(0,0,0,0.2)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
          ctx.beginPath();
          ctx.roundRect(calloutX, calloutY, CALLOUT_W, CALLOUT_H, CALLOUT_R);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;
          ctx.strokeStyle = '#E0E0E0';
          ctx.lineWidth = 1;
          ctx.stroke();

          var arrowCx = smx;
          var arrowTopY = calloutY + CALLOUT_H;
          ctx.beginPath();
          ctx.moveTo(arrowCx - 5, arrowTopY);
          ctx.lineTo(arrowCx, arrowTopY + ARROW_H);
          ctx.lineTo(arrowCx + 5, arrowTopY);
          ctx.closePath();
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.strokeStyle = '#E0E0E0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(arrowCx - 5, arrowTopY);
          ctx.lineTo(arrowCx, arrowTopY + ARROW_H);
          ctx.lineTo(arrowCx + 5, arrowTopY);
          ctx.stroke();

          ctx.fillStyle = '#333333';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(addrText, smx, calloutY + CALLOUT_H / 2);
          ctx.textAlign = 'start';
          ctx.textBaseline = 'alphabetic';
        }

        window._searchMarkerHit = {
          pinCx: smx, pinCy: PIN_CENTER_Y, pinR: PIN_R + 4,
          closeCx: closeCx, closeCy: closeCy, closeR: CLOSE_R + 4,
          tipX: smx, tipY: PIN_TIP_Y
        };
      } else {
        window._searchMarkerHit = null;
      }
    }

    // ── Hit-testing: find the closest marker to a map click ──
    function handleMapClick(clickLat, clickLng) {
      // Check search marker hit areas first (close button or pin body)
      if (searchMarkerLat !== null && window._searchMarkerHit) {
        var hit = window._searchMarkerHit;
        // Convert click lat/lng to canvas pixel coordinates
        var map = canvasOverlay.getMap();
        if (map) {
          var projection = canvasOverlay.getProjection();
          var bounds = map.getBounds();
          var neLat = bounds.getNorthEast().getLat();
          var neLng = bounds.getNorthEast().getLng();
          var swLat = bounds.getSouthWest().getLat();
          var swLng = bounds.getSouthWest().getLng();
          var nwLL = new kakao.maps.LatLng(neLat, swLng);
          var seLL = new kakao.maps.LatLng(swLat, neLng);
          var nwPt = projection.pointFromCoords(nwLL);
          var sePt = projection.pointFromCoords(seLL);
          var pxPerLng = (sePt.x - nwPt.x) / (neLng - swLng);
          var pxPerLat = (sePt.y - nwPt.y) / (swLat - neLat);
          var clickPx = (clickLng - swLng) * pxPerLng;
          var clickPy = (clickLat - neLat) * pxPerLat;

          // Check close button first (higher priority)
          var dcx = clickPx - hit.closeCx;
          var dcy = clickPy - hit.closeCy;
          if (dcx * dcx + dcy * dcy <= hit.closeR * hit.closeR) {
            // Close button hit — clear search marker
            searchMarkerLat = null;
            searchMarkerLng = null;
            searchMarkerAddress = '';
            searchMarkerCalloutVisible = false;
            window._searchMarkerHit = null;
            if (canvasOverlay && canvasOverlay.getMap()) {
              forceDrawMarkers();
            }
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'searchMarkerClose' }));
            return;
          }

          // Check pin body hit
          var dpx = clickPx - hit.pinCx;
          var dpy = clickPy - hit.pinCy;
          if (dpx * dpx + dpy * dpy <= hit.pinR * hit.pinR) {
            // Pin body hit — toggle callout
            searchMarkerCalloutVisible = !searchMarkerCalloutVisible;
            if (canvasOverlay && canvasOverlay.getMap()) {
              forceDrawMarkers();
            }
            return;
          }
        }
      }

      // In adding mode: place temporary new marker, notify React Native, skip hit-test
      if (isAddingMode) {
        newMarkerLat = clickLat;
        newMarkerLng = clickLng;
        // Force immediate redraw so the new marker appears instantly
        if (canvasOverlay && canvasOverlay.getMap()) {
          forceDrawMarkers();
        }

        // Notify React Native that geocoding has started (show loading)
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapTapStart' }));

        // Reverse geocode to get address, then notify React Native
        var sent = false;
        function sendMapTap(addr) {
          if (sent) return;
          sent = true;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapTap',
            lat: clickLat,
            lng: clickLng,
            address: addr || ''
          }));
        }
        // Fallback: send without address if geocoder takes too long or fails
        var fallbackTimer = setTimeout(function() { sendMapTap(''); }, 3000);
        try {
          var geocoder = new kakao.maps.services.Geocoder();
          geocoder.coord2Address(clickLng, clickLat, function(result, status) {
            clearTimeout(fallbackTimer);
            var address = '';
            if (status === kakao.maps.services.Status.OK && result[0]) {
              address = (result[0].road_address && result[0].road_address.address_name)
                || (result[0].address && result[0].address.address_name)
                || '';
            }
            sendMapTap(address);
          });
        } catch(e) {
          clearTimeout(fallbackTimer);
          sendMapTap('');
        }
        return;
      }

      var level = kakaoMap.getLevel();

      // Only hit-test individual markers (not clusters)
      if (level > CLUSTER_ZOOM_THRESHOLD) {
        if (!bottomSheetVisible) deselectMarker();
        return;
      }

      // Fixed hit radius in degrees (~30m). Do NOT scale by zoom level —
      // scaling causes an enormous hit area at higher zoom levels, making
      // random empty-space taps activate the nearest marker unintentionally.
      var hitLat = 0.0003;
      var hitLng = 0.0003;

      var bestDist = Infinity;
      var bestMarker = null;

      // Check all visible typed arrays (updated/createdByApp markers always visible)
      var typesToCheck = [];
      if (visibleTypes.building)   typesToCheck.push({ arr: buildingArr,     data: buildingData,     type: 'building' });
      if (visibleTypes.off_street) typesToCheck.push({ arr: offStreetArr,    data: offStreetData,    type: 'off_street' });
      if (visibleTypes.on_street)  typesToCheck.push({ arr: onStreetArr,     data: onStreetData,     type: 'on_street' });
      typesToCheck.push({ arr: updatedArr,      data: updatedData,      type: 'updated' });
      typesToCheck.push({ arr: createdByAppArr, data: createdByAppData, type: 'createdByApp' });

      for (var t = 0; t < typesToCheck.length; t++) {
        var arr = typesToCheck[t].arr;
        var data = typesToCheck[t].data;
        for (var i = 0; i < arr.length; i += 2) {
          var lat = arr[i], lng = arr[i + 1];
          var dLat = Math.abs(lat - clickLat);
          var dLng = Math.abs(lng - clickLng);
          if (dLat > hitLat || dLng > hitLng) continue;
          var dist = dLat * dLat + dLng * dLng;
          if (dist < bestDist) {
            bestDist = dist;
            bestMarker = data[i / 2];
          }
        }
      }

      if (bestMarker) {
        // selectMarker() already sets selectedMarkerLat/Lng/Type correctly (including isUpdated check)
        selectMarker(bestMarker.id);
        // Trigger redraw to show selection highlight
        if (canvasOverlay && canvasOverlay.getMap()) forceDrawMarkers();
        // Notify React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerClick',
          marker: bestMarker
        }));
      } else if (!bottomSheetVisible) {
        // Only deselect when bottom sheet is not visible —
        // tapping empty space on map while viewing a marker should not dismiss selection
        deselectMarker();
      }
    }

    // ── Adding mode control ──
    function setAddingMode(enabled) {
      isAddingMode = enabled;
      if (!enabled) {
        newMarkerLat = null;
        newMarkerLng = null;
      }
      if (canvasOverlay && canvasOverlay.getMap()) forceDrawMarkers();
    }

    function clearNewMarker() {
      newMarkerLat = null;
      newMarkerLng = null;
      if (canvasOverlay && canvasOverlay.getMap()) forceDrawMarkers();
    }

    // ── Search marker management ──
    function setSearchMarker(lat, lng, address) {
      searchMarkerLat = lat;
      searchMarkerLng = lng;
      searchMarkerAddress = address || '';
      searchMarkerCalloutVisible = false;
      if (canvasOverlay && canvasOverlay.getMap()) {
        forceDrawMarkers();
      }
    }

    function clearSearchMarker() {
      searchMarkerLat = null;
      searchMarkerLng = null;
      searchMarkerAddress = '';
      searchMarkerCalloutVisible = false;
      window._searchMarkerHit = null;
      if (canvasOverlay && canvasOverlay.getMap()) {
        forceDrawMarkers();
      }
    }

    // ── Selection management ──
    function selectMarker(markerId) {
      selectedMarkerId = markerId;
      // Find marker data to get lat/lng for highlight rendering
      var allData = [].concat(buildingData, offStreetData, onStreetData, updatedData, createdByAppData);
      for (var i = 0; i < allData.length; i++) {
        if (allData[i].id === markerId) {
          selectedMarkerLat = allData[i].lat;
          selectedMarkerLng = allData[i].lng;
          // createdByApp → green (#10A571), updated → solid blue (#072AC8), else parkingType color
          selectedMarkerType = allData[i].isCreatedByApp ? 'createdByApp'
            : allData[i].isUpdated ? 'updated'
            : (allData[i].parkingType || 'building');
          break;
        }
      }
      if (canvasOverlay && canvasOverlay.getMap()) forceDrawMarkers();
    }

    function selectMarkerAt(markerId, lat, lng, markerType) {
      selectedMarkerId = markerId;
      selectedMarkerLat = lat;
      selectedMarkerLng = lng;
      selectedMarkerType = markerType || 'building';
      bottomSheetVisible = true;
      if (canvasOverlay && canvasOverlay.getMap()) forceDrawMarkers();
    }

    function deselectMarker() {
      if (selectedMarkerId === null) return;
      selectedMarkerId = null;
      selectedMarkerLat = 0;
      selectedMarkerLng = 0;
      selectedMarkerType = null;
      bottomSheetVisible = false;
      if (canvasOverlay && canvasOverlay.getMap()) forceDrawMarkers();
    }

    function setBottomSheetVisible(visible) {
      bottomSheetVisible = visible;
    }

    // ── Set markers: dedup, split into typed arrays ──
    function setMarkers(markers) {
      // Preserve selection when bottom sheet is open (pan/zoom should not deselect)
      var prevSelectedId = bottomSheetVisible ? selectedMarkerId : null;
      var prevSelectedLat = bottomSheetVisible ? selectedMarkerLat : 0;
      var prevSelectedLng = bottomSheetVisible ? selectedMarkerLng : 0;
      var prevSelectedType = bottomSheetVisible ? selectedMarkerType : null;
      selectedMarkerId = null;

      // Deduplicate by address|parkingType or lat,lng|parkingType
      var seen = {};
      var unique = [];
      for (var i = 0; i < markers.length; i++) {
        var m = markers[i];
        var key = m.address
          ? m.address + '|' + (m.parkingType || '')
          : m.lat + ',' + m.lng + '|' + (m.parkingType || '');
        if (!seen[key]) {
          seen[key] = true;
          unique.push(m);
        }
      }

      // Split into typed arrays by parking type
      // Priority: isCreatedByApp > isUpdated > parkingType
      var bCoords = [], oCoords = [], sCoords = [], uCoords = [], cCoords = [];
      var bData = [], oData = [], sData = [], uData = [], cData = [];

      for (var i = 0; i < unique.length; i++) {
        var m = unique[i];
        if (m.isCreatedByApp) {
          // App-created markers always render green (#10A571) regardless of update state
          cCoords.push(m.lat, m.lng);
          cData.push(m);
        } else if (m.isUpdated) {
          // Updated markers render solid blue (#072AC8) regardless of parking type
          uCoords.push(m.lat, m.lng);
          uData.push(m);
        } else {
          var pt = m.parkingType || 'building';
          if (pt === 'building') {
            bCoords.push(m.lat, m.lng);
            bData.push(m);
          } else if (pt === 'off_street') {
            oCoords.push(m.lat, m.lng);
            oData.push(m);
          } else {
            sCoords.push(m.lat, m.lng);
            sData.push(m);
          }
        }
      }

      buildingArr = new Float64Array(bCoords);
      offStreetArr = new Float64Array(oCoords);
      onStreetArr = new Float64Array(sCoords);
      updatedArr = new Float64Array(uCoords);
      createdByAppArr = new Float64Array(cCoords);
      buildingData = bData;
      offStreetData = oData;
      onStreetData = sData;
      updatedData = uData;
      createdByAppData = cData;

      // Restore selection if bottom sheet was open
      if (prevSelectedId !== null) {
        selectedMarkerId = prevSelectedId;
        selectedMarkerLat = prevSelectedLat;
        selectedMarkerLng = prevSelectedLng;
        // Re-derive marker type from updated data arrays in case the marker
        // changed category (e.g. existing → updated after save)
        var restoredType = prevSelectedType;
        for (var ri = 0; ri < cData.length; ri++) {
          if (String(cData[ri].id) === String(prevSelectedId)) { restoredType = 'createdByApp'; break; }
        }
        if (restoredType === prevSelectedType) {
          for (var ri = 0; ri < uData.length; ri++) {
            if (String(uData[ri].id) === String(prevSelectedId)) { restoredType = 'updated'; break; }
          }
        }
        selectedMarkerType = restoredType;
      }

      // Force immediate redraw (bypass rAF throttle so markers appear instantly)
      if (canvasOverlay && canvasOverlay.getMap()) {
        forceDrawMarkers();
      }
    }

    // Show/hide markers by parking type
    function setVisibleTypes(types) {
      visibleTypes.building = types.indexOf('building') >= 0;
      visibleTypes.off_street = types.indexOf('off_street') >= 0;
      visibleTypes.on_street = types.indexOf('on_street') >= 0;
      if (canvasOverlay && canvasOverlay.getMap()) forceDrawMarkers();
    }

    // ── Zone boundary polygons — canvas-based rendering with bitmap caching ──
    // Renders ALL zone polygons on a single oversized canvas (with padding beyond
    // viewport). During pan, only CSS repositioning is done (zero draw calls).
    // Full re-render happens only on idle (user lifts finger) or zoom change.
    var zoneCanvas = null;
    var zoneCtx = null;
    var zoneOverlay = null;
    var zonePolygonData = [];  // Array of { coords: [[lng,lat], ...], _bbox, displayName? }
    var zoneLabelsVisible = false; // Whether zone number labels are shown
    var zoneRafId = 0;

    // Bitmap cache state: remember the viewport at last full render
    var zoneRenderOriginX = 0;  // tile-pixel X of canvas left edge at last render
    var zoneRenderOriginY = 0;  // tile-pixel Y of canvas top edge at last render
    var zoneRenderLevel = -1;   // zoom level at last render
    var zoneHasRendered = false; // true after first full render

    // Oversized canvas padding (fraction of viewport on each side)
    // 0.5 = canvas extends 50% beyond viewport in every direction → 2x viewport size
    var ZONE_PAD = 0.5;

    function createZoneCanvasOverlay() {
      zoneCanvas = document.createElement('canvas');
      zoneCanvas.style.position = 'absolute';
      zoneCanvas.style.pointerEvents = 'none';
      zoneCanvas.style.zIndex = '0';
      zoneCtx = zoneCanvas.getContext('2d');

      zoneOverlay = new kakao.maps.AbstractOverlay();
      var overlayRef = zoneOverlay;

      zoneOverlay.onAdd = function() {
        var panel = this.getPanels().overlayLayer;
        panel.appendChild(zoneCanvas);
      };

      zoneOverlay.onRemove = function() {
        if (zoneCanvas.parentNode) zoneCanvas.parentNode.removeChild(zoneCanvas);
        if (zoneRafId) { cancelAnimationFrame(zoneRafId); zoneRafId = 0; }
      };

      // Called on every pan/zoom frame by Kakao Maps.
      // Only repositions the cached bitmap — NO polygon re-rendering.
      zoneOverlay.draw = function() {
        var map = this.getMap();
        if (!map || zonePolygonData.length === 0) {
          zoneCanvas.width = 0;
          zoneCanvas.height = 0;
          zoneHasRendered = false;
          return;
        }

        if (!zoneHasRendered) {
          // First render or after data change — do a full render immediately
          fullRenderZones(overlayRef);
          return;
        }

        // Reposition canvas: translate the cached bitmap to match current pan offset.
        // The canvas was rendered with its top-left at (zoneRenderOriginX, zoneRenderOriginY)
        // in tile-pixel space. Just keep it pinned there — Kakao's overlay layer
        // already handles the coordinate system, so left/top in tile-pixels stays correct.
        zoneCanvas.style.left = zoneRenderOriginX + 'px';
        zoneCanvas.style.top = zoneRenderOriginY + 'px';
      };

      zoneOverlay.setMap(kakaoMap);

      // Full re-render on idle (user lifts finger after pan, or zoom animation ends)
      kakao.maps.event.addListener(kakaoMap, 'idle', function() {
        if (zonePolygonData.length > 0 && zoneOverlay && zoneOverlay.getMap()) {
          fullRenderZones(zoneOverlay);
        }
      });
    }

    // Full render: draw all visible polygons onto an oversized canvas
    function fullRenderZones(overlay) {
      var map = overlay.getMap();
      if (!map || zonePolygonData.length === 0) return;

      // Cancel any pending rAF from a previous call
      if (zoneRafId) { cancelAnimationFrame(zoneRafId); zoneRafId = 0; }

      var projection = overlay.getProjection();
      var bounds = map.getBounds();
      var level = map.getLevel();

      var neLat = bounds.getNorthEast().getLat();
      var neLng = bounds.getNorthEast().getLng();
      var swLat = bounds.getSouthWest().getLat();
      var swLng = bounds.getSouthWest().getLng();

      var mapNode = map.getNode();
      var viewW = mapNode.offsetWidth;
      var viewH = mapNode.offsetHeight;

      // Expand bounds by ZONE_PAD on each side so the canvas extends beyond viewport
      var padW = viewW * ZONE_PAD;
      var padH = viewH * ZONE_PAD;
      var totalW = viewW + padW * 2;
      var totalH = viewH + padH * 2;

      // Compute the NW corner of the oversized canvas in tile-pixel space
      var nwLL = new kakao.maps.LatLng(neLat, swLng);
      var nwPt = projection.pointFromCoords(nwLL);
      var canvasLeft = nwPt.x - padW;
      var canvasTop = nwPt.y - padH;

      // SE corner of the oversized canvas
      var seLL = new kakao.maps.LatLng(swLat, neLng);
      var sePt = projection.pointFromCoords(seLL);

      // Expand geo bounds proportionally to match the padded canvas
      var latRange = neLat - swLat;
      var lngRange = neLng - swLng;
      var padLat = latRange * ZONE_PAD;
      var padLng = lngRange * ZONE_PAD;
      var exSwLat = swLat - padLat;
      var exNeLat = neLat + padLat;
      var exSwLng = swLng - padLng;
      var exNeLng = neLng + padLng;

      // Linear interpolation: lat/lng → pixel within the oversized canvas
      var pxPerLng = (sePt.x - nwPt.x) / (neLng - swLng);
      var pxPerLat = (sePt.y - nwPt.y) / (swLat - neLat);

      // Position and size the canvas
      zoneCanvas.style.left = canvasLeft + 'px';
      zoneCanvas.style.top = canvasTop + 'px';
      zoneCanvas.style.width = totalW + 'px';
      zoneCanvas.style.height = totalH + 'px';

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      zoneCanvas.width = totalW * dpr;
      zoneCanvas.height = totalH * dpr;
      zoneCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      zoneCtx.clearRect(0, 0, totalW, totalH);

      // Offset: polygon pixel coords are relative to nwPt, but canvas starts at (nwPt - pad)
      var offX = padW;
      var offY = padH;

      // Scale stroke by zoom level
      var zoomScale = Math.max(0.5, Math.min(1, Math.pow(2, 5 - level)));

      // Fill pass: batch all polygons into one path
      zoneCtx.fillStyle = 'rgba(35, 138, 175, 0.12)';
      zoneCtx.beginPath();
      for (var p = 0; p < zonePolygonData.length; p++) {
        var coords = zonePolygonData[p].coords;
        if (!coords || coords.length < 3) continue;

        var bbox = zonePolygonData[p]._bbox;
        if (bbox && (bbox.maxLat < exSwLat || bbox.minLat > exNeLat || bbox.maxLng < exSwLng || bbox.minLng > exNeLng)) continue;

        var lng0 = coords[0][0], lat0 = coords[0][1];
        zoneCtx.moveTo((lng0 - swLng) * pxPerLng + offX, (lat0 - neLat) * pxPerLat + offY);
        for (var c = 1; c < coords.length; c++) {
          zoneCtx.lineTo((coords[c][0] - swLng) * pxPerLng + offX, (coords[c][1] - neLat) * pxPerLat + offY);
        }
        zoneCtx.closePath();
      }
      zoneCtx.fill();

      // Stroke pass: dashed outline per polygon
      zoneCtx.strokeStyle = 'rgba(35, 138, 175, 0.8)';
      zoneCtx.lineWidth = 2 * zoomScale;
      zoneCtx.setLineDash([6 * zoomScale, 4 * zoomScale]);
      for (var p = 0; p < zonePolygonData.length; p++) {
        var coords = zonePolygonData[p].coords;
        if (!coords || coords.length < 3) continue;

        var bbox = zonePolygonData[p]._bbox;
        if (bbox && (bbox.maxLat < exSwLat || bbox.minLat > exNeLat || bbox.maxLng < exSwLng || bbox.minLng > exNeLng)) continue;

        zoneCtx.beginPath();
        var lng0 = coords[0][0], lat0 = coords[0][1];
        zoneCtx.moveTo((lng0 - swLng) * pxPerLng + offX, (lat0 - neLat) * pxPerLat + offY);
        for (var c = 1; c < coords.length; c++) {
          zoneCtx.lineTo((coords[c][0] - swLng) * pxPerLng + offX, (coords[c][1] - neLat) * pxPerLat + offY);
        }
        zoneCtx.closePath();
        zoneCtx.stroke();
      }
      zoneCtx.setLineDash([]);

      // Zone number labels — rendered at polygon centroid when enabled
      if (zoneLabelsVisible) {
        var fontSize = Math.round(17 * Math.pow(1.25, 6 - level));
        if (fontSize < 8) fontSize = 8;
        zoneCtx.font = '700 ' + fontSize + 'px Pretendard, sans-serif';
        zoneCtx.textAlign = 'center';
        zoneCtx.textBaseline = 'middle';
        for (var p = 0; p < zonePolygonData.length; p++) {
          var name = zonePolygonData[p].displayName;
          if (!name) continue;
          var bbox = zonePolygonData[p]._bbox;
          if (bbox && (bbox.maxLat < exSwLat || bbox.minLat > exNeLat || bbox.maxLng < exSwLng || bbox.minLng > exNeLng)) continue;
          // Centroid of bounding box
          var cLng = (bbox.minLng + bbox.maxLng) / 2;
          var cLat = (bbox.minLat + bbox.maxLat) / 2;
          var cx = (cLng - swLng) * pxPerLng + offX;
          var cy = (cLat - neLat) * pxPerLat + offY;
          // Background pill
          var textW = zoneCtx.measureText(name).width;
          var padX = 6, padY = 2;
          zoneCtx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          zoneCtx.beginPath();
          var rx = textW / 2 + padX, ry = fontSize / 2 + padY, r = 4;
          zoneCtx.moveTo(cx - rx + r, cy - ry);
          zoneCtx.lineTo(cx + rx - r, cy - ry);
          zoneCtx.quadraticCurveTo(cx + rx, cy - ry, cx + rx, cy - ry + r);
          zoneCtx.lineTo(cx + rx, cy + ry - r);
          zoneCtx.quadraticCurveTo(cx + rx, cy + ry, cx + rx - r, cy + ry);
          zoneCtx.lineTo(cx - rx + r, cy + ry);
          zoneCtx.quadraticCurveTo(cx - rx, cy + ry, cx - rx, cy + ry - r);
          zoneCtx.lineTo(cx - rx, cy - ry + r);
          zoneCtx.quadraticCurveTo(cx - rx, cy - ry, cx - rx + r, cy - ry);
          zoneCtx.closePath();
          zoneCtx.fill();
          // Text
          zoneCtx.fillStyle = '#EF4444';
          zoneCtx.fillText(name, cx, cy);
        }
      }

      // Save render state for bitmap caching
      zoneRenderOriginX = canvasLeft;
      zoneRenderOriginY = canvasTop;
      zoneRenderLevel = level;
      zoneHasRendered = true;
    }

    function setZonePolygons(polygons) {
      if (!polygons || polygons.length === 0) {
        zonePolygonData = [];
        zoneHasRendered = false;
        if (zoneOverlay && zoneOverlay.getMap()) zoneOverlay.draw();
        return;
      }

      // Pre-compute bounding boxes for viewport culling
      zonePolygonData = [];
      for (var p = 0; p < polygons.length; p++) {
        var coords = polygons[p].coords;
        if (!coords || coords.length < 3) continue;
        var minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        for (var c = 0; c < coords.length; c++) {
          var lng = coords[c][0], lat = coords[c][1];
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        }
        zonePolygonData.push({
          coords: coords,
          _bbox: { minLat: minLat, maxLat: maxLat, minLng: minLng, maxLng: maxLng },
          displayName: polygons[p].displayName || ''
        });
      }

      // Force immediate full render
      zoneHasRendered = false;
      if (zoneOverlay && zoneOverlay.getMap()) {
        fullRenderZones(zoneOverlay);
      }
    }

    function setZoneLabelsVisible(visible) {
      zoneLabelsVisible = !!visible;
      // Force re-render to show/hide labels
      zoneHasRendered = false;
      if (zoneOverlay && zoneOverlay.getMap()) {
        fullRenderZones(zoneOverlay);
      }
    }

    window.setZonePolygons = setZonePolygons;
    window.setZoneLabelsVisible = setZoneLabelsVisible;
    window.setMarkers = setMarkers;
    window.selectMarker = selectMarker;
    window.selectMarkerAt = selectMarkerAt;
    window.deselectMarker = deselectMarker;
    window.setBottomSheetVisible = setBottomSheetVisible;
    window.setVisibleTypes = setVisibleTypes;
    window.setAddingMode = setAddingMode;
    window.clearNewMarker = clearNewMarker;
    window.setSearchMarker = setSearchMarker;
    window.clearSearchMarker = clearSearchMarker;
  </script>
</body>
</html>
      `;
    };

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          source={{ html: generateHTML(), baseUrl: "https://localhost" }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          originWhitelist={["*"]}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          renderToHardwareTextureAndroid={true}
          androidLayerType="hardware"
          cacheEnabled={true}
          cacheMode="LOAD_NO_CACHE"
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView error:", nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView HTTP error:", nativeEvent.statusCode);
          }}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
