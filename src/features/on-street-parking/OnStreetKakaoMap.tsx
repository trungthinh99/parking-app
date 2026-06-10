import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { PolygonCoordinates } from "@/src/api-contracts";

// Types for on-street parking markers on the map
export interface OnStreetParkingMarker {
  id: string;
  lat: number;
  lng: number;
  type: "pending" | "completed";
  label?: string;
  /** Marker mode: "new" = create new survey, "existing" = edit existing */
  mode?: "new" | "existing";
  /** On-street sub-type determines marker color and X mark */
  onStreetSubType?: string;
  /** Whether this marker has been manually updated */
  isUpdated?: boolean;
  /** Whether this marker has been confirmed/completed by surveyor / 조사 확인 완료 여부 */
  isConfirmed?: boolean;
  /** Address */
  address?: string | null;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface OnStreetKakaoMapRef {
  moveToLocation: (lat: number, lng: number) => void;
  moveToLocationWithOffset: (lat: number, lng: number, offsetY: number) => void;
  setMarkers: (markers: OnStreetParkingMarker[]) => void;
  getCurrentLocation: () => void;
  selectMarker: (markerId: string) => void;
  selectMarkerAt: (markerId: string, lat: number, lng: number, subType?: string) => void;
  /** Update the sub-type of the currently selected marker and redraw immediately */
  updateSelectedMarkerSubType: (subType: string) => void;
  deselectMarker: () => void;
  setBottomSheetVisible: (visible: boolean) => void;
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
  /** Start polygon drawing mode for a marker */
  startPolygonDrawing: (markerId: string) => void;
  /** Cancel polygon drawing mode */
  cancelPolygonDrawing: () => void;
  /** Set saved polygon data for all markers */
  setMarkerPolygons: (data: Record<string, PolygonCoordinates>) => void;
  /** Show or hide saved marker polygons on the map */
  setPolygonsVisible: (visible: boolean) => void;
  /** Trigger save of the current drawn polygon */
  savePolygonDrawing: () => void;
  /** Delete the polygon for the current drawing marker and exit drawing mode */
  deletePolygonDrawing: () => void;
}

interface OnStreetKakaoMapProps {
  appKey: string;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  markers?: OnStreetParkingMarker[];
  onMarkerPress?: (marker: OnStreetParkingMarker) => void;
  onMapReady?: () => void;
  onLocationReceived?: (lat: number, lng: number) => void;
  onBoundsChanged?: (bounds: MapBounds) => void;
  /** Called immediately when user taps the map in adding mode (before reverse geocoding) */
  onMapTapStart?: () => void;
  /** Called when user taps an empty map area in adding mode (after reverse geocoding completes) */
  onMapTap?: (lat: number, lng: number, address?: string) => void;
  /** Called when user taps the close button on the search result marker */
  onSearchMarkerClose?: () => void;
  /** Called when polygon drawing mode starts */
  onPolygonDrawingStarted?: (markerId: string) => void;
  /** Called when polygon drawing mode is cancelled */
  onPolygonDrawingCancelled?: () => void;
  /** Called when polygon is saved */
  onPolygonSave?: (markerId: string, polygonData: PolygonCoordinates) => void;
  /** Called when polygon is deleted */
  onPolygonDelete?: (markerId: string) => void;
  style?: ViewStyle;
}

/**
 * KakaoMap component for on-street (노상) parking
 * Uses canvas-based rendering with circle markers for on_street sub-types:
 * - on_street_legal_day: yellow circle (합법 주간)
 * - on_street_illegal_day: yellow circle with X (불법 주간)
 * - on_street_legal_night: black circle (합법 야간)
 * - on_street_illegal_night: black circle with X (불법 야간)
 */
export const OnStreetKakaoMap = forwardRef<OnStreetKakaoMapRef, OnStreetKakaoMapProps>(
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
      onPolygonDrawingStarted,
      onPolygonDrawingCancelled,
      onPolygonSave,
      onPolygonDelete,
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
      setMarkers: (newMarkers: OnStreetParkingMarker[]) => {
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
      selectMarkerAt: (markerId: string, lat: number, lng: number, subType?: string) => {
        webViewRef.current?.injectJavaScript(`
          if (window.selectMarkerAt) {
            window.selectMarkerAt('${markerId}', ${lat}, ${lng}, '${subType || ''}');
          }
          true;
        `);
      },
      updateSelectedMarkerSubType: (subType: string) => {
        webViewRef.current?.injectJavaScript(`
          if (window.updateSelectedMarkerSubType) {
            window.updateSelectedMarkerSubType('${subType}');
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
      startPolygonDrawing: (markerId: string) => {
        webViewRef.current?.injectJavaScript(`
          if (window.startPolygonDrawing) {
            window.startPolygonDrawing('${markerId}');
          }
          true;
        `);
      },
      cancelPolygonDrawing: () => {
        webViewRef.current?.injectJavaScript(`
          if (window.cancelPolygonDrawing) {
            window.cancelPolygonDrawing();
          }
          true;
        `);
      },
      setMarkerPolygons: (data: Record<string, PolygonCoordinates>) => {
        const json = JSON.stringify(data);
        webViewRef.current?.injectJavaScript(`
          if (window.setMarkerPolygons) {
            window.setMarkerPolygons(${json});
          }
          true;
        `);
      },
      setPolygonsVisible: (visible: boolean) => {
        webViewRef.current?.injectJavaScript(`
          if (window.setPolygonsVisible) {
            window.setPolygonsVisible(${visible});
          }
          true;
        `);
      },
      savePolygonDrawing: () => {
        webViewRef.current?.injectJavaScript(`
          if (window.savePolygonDrawing) {
            window.savePolygonDrawing();
          }
          true;
        `);
      },
      deletePolygonDrawing: () => {
        webViewRef.current?.injectJavaScript(`
          if (window.deletePolygonDrawing) {
            window.deletePolygonDrawing();
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
          case "polygonDrawingStarted":
            onPolygonDrawingStarted?.(data.markerId);
            break;
          case "polygonDrawingCancelled":
            onPolygonDrawingCancelled?.();
            break;
          case "polygonSave":
            onPolygonSave?.(data.markerId, data.polygonData);
            break;
          case "polygonDelete":
            onPolygonDelete?.(data.markerId);
            break;
        }
      } catch {
        // Ignore parse errors
      }
    };

    // Generate HTML content for Kakao Map with canvas-based circle marker rendering
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

    // ── Marker style constants for on-street parking (circle markers) ──
    // Colors per on-street sub-type
    var SUBTYPE_STYLES = {
      on_street_legal_day:     { fill: '#FFDA09', hasX: false },
      on_street_illegal_day:   { fill: '#FFDA09', hasX: true },
      on_street_legal_night:   { fill: '#2D2D2D', hasX: false },
      on_street_illegal_night: { fill: '#2D2D2D', hasX: true }
    };

    // Zoom threshold: level <= this shows individual markers, > shows clusters
    var CLUSTER_ZOOM_THRESHOLD = 6;

    // ── Canvas overlay state ──
    // Typed arrays per sub-type only: [lat, lng, lat, lng, ...]
    var legalDayArr = new Float64Array(0);
    var illegalDayArr = new Float64Array(0);
    var legalNightArr = new Float64Array(0);
    var illegalNightArr = new Float64Array(0);

    // Original marker objects for hit-testing
    var legalDayData = [];
    var illegalDayData = [];
    var legalNightData = [];
    var illegalNightData = [];

    // Adding mode state
    var isAddingMode = false;
    var newMarkerLat = null;
    var newMarkerLng = null;

    // Search marker state: teardrop pin placed when user selects a search result
    var searchMarkerLat = null;
    var searchMarkerLng = null;
    var searchMarkerAddress = '';
    var searchMarkerCalloutVisible = false;

    // Selection state
    var selectedMarkerId = null;
    var selectedMarkerLat = 0;
    var selectedMarkerLng = 0;
    var selectedMarkerSubType = null;
    var selectedMarkerIsConfirmed = false;
    var bottomSheetVisible = false;

    // ── Polygon drawing state ──
    var isPolygonDrawingMode = false;
    var polygonDrawingMarkerId = null;
    var drawStartPx = null;
    var drawCurrentPx = null;
    var isDrawing = false;
    var drawnPolygon = null; // { corners: [[lat,lng],...], rotation: number, centerPx: {x,y}, cornersPx: [{x,y},...] }
    var activeHandle = null; // 'tl' | 'tr' | 'br' | 'bl' | 'rotate' | null
    var handleDragStart = null; // { angle, rotation } for rotate
    var markerPolygons = {}; // markerId -> { corners, rotation }
    var polygonsVisible = true; // toggled by filter bottom sheet

    // rAF throttle
    var rafId = 0;
    var pendingDraw = false;

    // Canvas overlay reference
    var canvasOverlay = null;
    var canvas = null;
    var ctx = null;

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

            // Force canvas redraw on pan/zoom
            kakao.maps.event.addListener(kakaoMap, 'bounds_changed', function() {
              if (zoneOverlay && zoneOverlay.getMap()) zoneOverlay.draw();
              if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
            });

            // Notify React Native when viewport changes
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

            // Send initial bounds
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
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      };

      var overlayRef = canvasOverlay;

      canvasOverlay.draw = function() {
        var map = this.getMap();
        var markerTotal = legalDayArr.length + illegalDayArr.length + legalNightArr.length
          + illegalNightArr.length;
        // Canvas has content to draw when there are markers OR saved polygons OR the active
        // drawing polygon OR the new-marker/search-marker overlays. Previously we zeroed the
        // canvas when markerTotal === 0, which erased saved polygons while markers were
        // momentarily empty (e.g. between viewport refetches after saving a polygon).
        var hasPolygons = false;
        if (polygonsVisible) {
          for (var _pk in markerPolygons) { if (markerPolygons.hasOwnProperty(_pk)) { hasPolygons = true; break; } }
        }
        var hasOverlays = hasPolygons
          || isPolygonDrawingMode
          || newMarkerLat !== null
          || searchMarkerLat !== null
          || selectedMarkerId !== null;
        if (!map || (markerTotal === 0 && !hasOverlays)) {
          canvas.width = 0;
          canvas.height = 0;
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

        canvas.style.left = nwPt.x + 'px';
        canvas.style.top = nwPt.y + 'px';
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        if (pendingDraw) return;
        pendingDraw = true;
        rafId = requestAnimationFrame(function() {
          pendingDraw = false;
          actualDraw(overlayRef);
        });
      };

      canvasOverlay.setMap(kakaoMap);
    }

    // ── Actual pixel rendering ──
    function actualDraw(overlay) {
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

      canvas.style.left = nwPt.x + 'px';
      canvas.style.top = nwPt.y + 'px';
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var pxPerLng = (sePt.x - nwPt.x) / (neLng - swLng);
      var pxPerLat = (sePt.y - nwPt.y) / (swLat - neLat);

      if (level <= CLUSTER_ZOOM_THRESHOLD) {
        renderIndividualMarkers(pxPerLng, pxPerLat, swLat, swLng, neLat, neLng, w, h);
      } else {
        renderClusters(pxPerLng, pxPerLat, swLat, swLng, neLat, neLng, w, h, level);
      }
    }

    // ── Draw a circle marker ──
    function drawCircle(x, y, r, fillColor, hasX) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Draw X mark for illegal types
      if (hasX) {
        var xSize = r * 0.35;
        // Red X on top of circle
        ctx.strokeStyle = '#FF4040';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - xSize, y - xSize);
        ctx.lineTo(x + xSize, y + xSize);
        ctx.moveTo(x + xSize, y - xSize);
        ctx.lineTo(x - xSize, y + xSize);
        ctx.stroke();
        ctx.lineCap = 'butt';
      }
    }

    // ── Individual circle markers (zoomed in) ──
    function renderIndividualMarkers(pxPerLng, pxPerLat, swLat, swLng, neLat, neLng, width, height) {
      ctx.clearRect(0, 0, width, height);

      // ── 1. Render saved polygons FIRST (below markers) ──
      // Skip entirely when filter has polygons hidden — drawing-mode overlay still renders below.
      var polyKeys = polygonsVisible ? Object.keys(markerPolygons) : [];
      for (var pi = 0; pi < polyKeys.length; pi++) {
        var pMarkerId = polyKeys[pi];
        if (isPolygonDrawingMode && pMarkerId === polygonDrawingMarkerId) continue;
        var pData = markerPolygons[pMarkerId];
        if (!pData || !pData.corners || pData.corners.length < 4) continue;
        var pCornersPx = [];
        for (var pc = 0; pc < pData.corners.length; pc++) {
          var plat = pData.corners[pc][0], plng = pData.corners[pc][1];
          pCornersPx.push({ x: (plng - swLng) * pxPerLng, y: (plat - neLat) * pxPerLat });
        }
        ctx.beginPath();
        ctx.moveTo(pCornersPx[0].x, pCornersPx[0].y);
        for (var pj = 1; pj < pCornersPx.length; pj++) ctx.lineTo(pCornersPx[pj].x, pCornersPx[pj].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(35, 138, 175, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#238AAF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // ── 2. Render active drawing polygon BEFORE markers ──
      if (isPolygonDrawingMode) {
        if (isDrawing && drawStartPx && drawCurrentPx) {
          var rx = Math.min(drawStartPx.x, drawCurrentPx.x);
          var ry = Math.min(drawStartPx.y, drawCurrentPx.y);
          var rw = Math.abs(drawCurrentPx.x - drawStartPx.x);
          var rh = Math.abs(drawCurrentPx.y - drawStartPx.y);
          ctx.fillStyle = 'rgba(35, 138, 175, 0.3)';
          ctx.fillRect(rx, ry, rw, rh);
          ctx.strokeStyle = '#238AAF';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(rx, ry, rw, rh);
          ctx.setLineDash([]);
        }
        if (drawnPolygon && drawnPolygon.cornersPx && drawnPolygon.cornersPx.length === 4) {
          var dp0 = drawnPolygon.cornersPx;
          ctx.beginPath();
          ctx.moveTo(dp0[0].x, dp0[0].y);
          for (var di0 = 1; di0 < dp0.length; di0++) ctx.lineTo(dp0[di0].x, dp0[di0].y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(35, 138, 175, 0.3)';
          ctx.fill();
          ctx.strokeStyle = '#238AAF';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      var RADIUS = 7;
      var PAD = RADIUS * 2;

      // Helper: draw typed array as circles
      function drawCircles(arr, fillColor, hasX) {
        if (arr.length === 0) return;

        for (var i = 0; i < arr.length; i += 2) {
          var lat = arr[i], lng = arr[i + 1];
          // Skip selected marker — it will be drawn last on top
          if (selectedMarkerId !== null && lat === selectedMarkerLat && lng === selectedMarkerLng) continue;
          if (lat < swLat || lat > neLat || lng < swLng || lng > neLng) continue;
          var x = (lng - swLng) * pxPerLng;
          var y = (lat - neLat) * pxPerLat;
          if (x < -PAD || x > width + PAD || y < -PAD || y > height + PAD) continue;
          drawCircle(x, y, RADIUS, fillColor, hasX);
        }
      }

      // Draw each sub-type (normal markers first)
      drawCircles(legalDayArr, SUBTYPE_STYLES.on_street_legal_day.fill, false);
      drawCircles(illegalDayArr, SUBTYPE_STYLES.on_street_illegal_day.fill, true);
      drawCircles(legalNightArr, SUBTYPE_STYLES.on_street_legal_night.fill, false);
      drawCircles(illegalNightArr, SUBTYPE_STYLES.on_street_illegal_night.fill, true);

      // Draw selected marker LAST so it renders on top of all other markers
      if (selectedMarkerId !== null) {
        var sLat = selectedMarkerLat;
        var sLng = selectedMarkerLng;
        if (sLat >= swLat && sLat <= neLat && sLng >= swLng && sLng <= neLng) {
          var sx = (sLng - swLng) * pxPerLng;
          var sy = (sLat - neLat) * pxPerLat;
          var selStyle = getMarkerStyle(selectedMarkerSubType);
          var SEL_RADIUS = 14;

          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 6;
          drawCircle(sx, sy, SEL_RADIUS, selStyle.fill, selStyle.hasX);
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }

      // Draw temporary new marker in adding mode (scaled-up yellow circle)
      if (newMarkerLat !== null && newMarkerLng !== null) {
        var nx = (newMarkerLng - swLng) * pxPerLng;
        var ny = (newMarkerLat - neLat) * pxPerLat;
        var NEW_RADIUS = 11;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 6;
        drawCircle(nx, ny, NEW_RADIUS, '#FFDA09', false);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      // Draw search marker: teardrop pin with close button and optional address callout
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

      // ── 4. Drawing mode handles/buttons ABOVE markers ──
      if (isPolygonDrawingMode && drawnPolygon && drawnPolygon.cornersPx && drawnPolygon.cornersPx.length === 4) {
        var dp = drawnPolygon.cornersPx;
        var dCenter = drawnPolygon.centerPx;

        // Move icon at center (4-arrow crosshair)
        var mIcoSize = 8;
        ctx.strokeStyle = 'rgba(35, 138, 175, 0.8)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(dCenter.x - mIcoSize, dCenter.y); ctx.lineTo(dCenter.x + mIcoSize, dCenter.y);
        ctx.moveTo(dCenter.x, dCenter.y - mIcoSize); ctx.lineTo(dCenter.x, dCenter.y + mIcoSize);
        ctx.stroke();
        var arrowSize = 3;
        ctx.beginPath();
        ctx.moveTo(dCenter.x + mIcoSize, dCenter.y); ctx.lineTo(dCenter.x + mIcoSize - arrowSize, dCenter.y - arrowSize); ctx.moveTo(dCenter.x + mIcoSize, dCenter.y); ctx.lineTo(dCenter.x + mIcoSize - arrowSize, dCenter.y + arrowSize);
        ctx.moveTo(dCenter.x - mIcoSize, dCenter.y); ctx.lineTo(dCenter.x - mIcoSize + arrowSize, dCenter.y - arrowSize); ctx.moveTo(dCenter.x - mIcoSize, dCenter.y); ctx.lineTo(dCenter.x - mIcoSize + arrowSize, dCenter.y + arrowSize);
        ctx.moveTo(dCenter.x, dCenter.y - mIcoSize); ctx.lineTo(dCenter.x - arrowSize, dCenter.y - mIcoSize + arrowSize); ctx.moveTo(dCenter.x, dCenter.y - mIcoSize); ctx.lineTo(dCenter.x + arrowSize, dCenter.y - mIcoSize + arrowSize);
        ctx.moveTo(dCenter.x, dCenter.y + mIcoSize); ctx.lineTo(dCenter.x - arrowSize, dCenter.y + mIcoSize - arrowSize); ctx.moveTo(dCenter.x, dCenter.y + mIcoSize); ctx.lineTo(dCenter.x + arrowSize, dCenter.y + mIcoSize - arrowSize);
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Corner handles (white squares with teal border)
        for (var hi = 0; hi < 4; hi++) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(dp[hi].x - 6, dp[hi].y - 6, 12, 12);
          ctx.strokeStyle = '#238AAF';
          ctx.lineWidth = 2;
          ctx.strokeRect(dp[hi].x - 6, dp[hi].y - 6, 12, 12);
        }

        // Close button (X) — top-right corner, fixed 28px outside corner
        var trH = dp[1];
        var closeDirX = trH.x - dCenter.x; var closeDirY = trH.y - dCenter.y;
        var closeDirLen = Math.sqrt(closeDirX * closeDirX + closeDirY * closeDirY) || 1;
        var closeX = trH.x + (closeDirX / closeDirLen) * 28;
        var closeY = trH.y + (closeDirY / closeDirLen) * 28;
        ctx.beginPath();
        ctx.arc(closeX, closeY, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(closeX - 4, closeY - 4); ctx.lineTo(closeX + 4, closeY + 4);
        ctx.moveTo(closeX + 4, closeY - 4); ctx.lineTo(closeX - 4, closeY + 4);
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Rotation handle — bottom-right corner, fixed 28px outside corner
        var brH = dp[2];
        var rotDirX = brH.x - dCenter.x; var rotDirY = brH.y - dCenter.y;
        var rotDirLen = Math.sqrt(rotDirX * rotDirX + rotDirY * rotDirY) || 1;
        var rotX = brH.x + (rotDirX / rotDirLen) * 28;
        var rotY = brH.y + (rotDirY / rotDirLen) * 28;
        ctx.beginPath();
        ctx.arc(rotX, rotY, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#238AAF';
        ctx.fill();
        // Draw ArrowRotateLeft icon (iconsax Linear) scaled to fit inside the circle
        var iconSize = 14;
        var iconScale = iconSize / 24;
        ctx.save();
        ctx.translate(rotX - iconSize / 2, rotY - iconSize / 2);
        ctx.scale(iconScale, iconScale);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5 / iconScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        var p = new Path2D('M9.11 5.08c.87-.26 1.83-.43 2.89-.43 4.79 0 8.67 3.88 8.67 8.67s-3.88 8.67-8.67 8.67-8.67-3.88-8.67-8.67c0-1.78.54-3.44 1.46-4.82M7.87 5.32L10.76 2M7.87 5.32l3.37 2.46');
        ctx.stroke(p);
        ctx.restore();

      }
    }

    // Get marker style info by sub-type key
    function getMarkerStyle(subType) {
      return SUBTYPE_STYLES[subType] || SUBTYPE_STYLES.on_street_legal_day;
    }

    // ── Cluster rendering (zoomed out) ──
    function renderClusters(pxPerLng, pxPerLat, swLat, swLng, neLat, neLng, width, height, level) {
      ctx.clearRect(0, 0, width, height);

      var gridLat = 0.018 * Math.pow(2, Math.max(0, level - CLUSTER_ZOOM_THRESHOLD - 1));
      var gridLng = 0.022 * Math.pow(2, Math.max(0, level - CLUSTER_ZOOM_THRESHOLD - 1));

      var configs = [
        { arr: legalDayArr,     type: 'on_street_legal_day',     oLat: 0,               oLng: 0 },
        { arr: illegalDayArr,   type: 'on_street_illegal_day',   oLat: gridLat * 0.25,  oLng: gridLng * 0.15 },
        { arr: legalNightArr,   type: 'on_street_legal_night',   oLat: gridLat * 0.5,   oLng: gridLng * 0.35 },
        { arr: illegalNightArr, type: 'on_street_illegal_night', oLat: gridLat * 0.75,  oLng: gridLng * 0.55 }
      ];

      var allClusters = [];
      var padLat = gridLat;
      var padLng = gridLng;

      for (var c = 0; c < configs.length; c++) {
        var cfg = configs[c];
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
          var cx = (cLng - swLng) * pxPerLng;
          var cy = (cLat - neLat) * pxPerLat;

          var hash = ((cell.cellLat * 2654435761) ^ (cell.cellLng * 2246822519)) >>> 0;
          var offX = ((hash & 0xFF) / 255.0 - 0.5) * 12;
          var offY = (((hash >> 8) & 0xFF) / 255.0 - 0.5) * 10;

          allClusters.push({
            cx: cx + offX,
            cy: cy + offY,
            count: cell.count,
            markerType: cfg.type
          });
        }
      }

      allClusters.sort(function(a, b) { return a.cy - b.cy; });

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (var i = 0; i < allClusters.length; i++) {
        var cl = allClusters[i];
        var r = Math.min(9 + Math.log2(cl.count) * 1.8, 18);
        var tipY = cl.cy + r * 1.35;
        var clStyle = getMarkerStyle(cl.markerType);
        var clColor = clStyle.fill;

        // Teardrop pin shape
        ctx.beginPath();
        ctx.arc(cl.cx, cl.cy, r, Math.PI * 0.82, Math.PI * 0.18);
        ctx.lineTo(cl.cx, tipY);
        ctx.closePath();
        ctx.fillStyle = clColor;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Count label
        ctx.fillStyle = '#FFFFFF';
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
      // Skip normal click handling if in polygon drawing mode
      if (isPolygonDrawingMode) return;

      // Check search marker hit areas first (close button or pin body)
      if (searchMarkerLat !== null && window._searchMarkerHit) {
        var hit = window._searchMarkerHit;
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

          var dcx = clickPx - hit.closeCx;
          var dcy = clickPy - hit.closeCy;
          if (dcx * dcx + dcy * dcy <= hit.closeR * hit.closeR) {
            searchMarkerLat = null;
            searchMarkerLng = null;
            searchMarkerAddress = '';
            searchMarkerCalloutVisible = false;
            window._searchMarkerHit = null;
            if (canvasOverlay && canvasOverlay.getMap()) {
              canvasOverlay.draw();
              actualDraw(canvasOverlay);
            }
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'searchMarkerClose' }));
            return;
          }

          var dpx = clickPx - hit.pinCx;
          var dpy = clickPy - hit.pinCy;
          if (dpx * dpx + dpy * dpy <= hit.pinR * hit.pinR) {
            searchMarkerCalloutVisible = !searchMarkerCalloutVisible;
            if (canvasOverlay && canvasOverlay.getMap()) {
              canvasOverlay.draw();
              actualDraw(canvasOverlay);
            }
            return;
          }
        }
      }

      // In adding mode: place temporary new marker, notify React Native
      if (isAddingMode) {
        newMarkerLat = clickLat;
        newMarkerLng = clickLng;
        if (canvasOverlay && canvasOverlay.getMap()) {
          canvasOverlay.draw();
          actualDraw(canvasOverlay);
        }

        // Notify React Native that geocoding has started
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapTapStart' }));

        // Reverse geocode to get address
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
      if (level > CLUSTER_ZOOM_THRESHOLD) {
        if (!bottomSheetVisible) deselectMarker();
        return;
      }

      // Fixed hit radius in degrees (~30m)
      var hitLat = 0.0003;
      var hitLng = 0.0003;

      var bestDist = Infinity;
      var bestMarker = null;

      var typesToCheck = [
        { arr: legalDayArr,     data: legalDayData },
        { arr: illegalDayArr,   data: illegalDayData },
        { arr: legalNightArr,   data: legalNightData },
        { arr: illegalNightArr, data: illegalNightData }
      ];

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
        selectMarker(bestMarker.id);
        if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerClick',
          marker: bestMarker
        }));
      } else if (!bottomSheetVisible) {
        // Only deselect when bottom sheet is not visible
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
      if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
    }

    function clearNewMarker() {
      newMarkerLat = null;
      newMarkerLng = null;
      if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
    }

    // ── Search marker management ──
    function setSearchMarker(lat, lng, address) {
      searchMarkerLat = lat;
      searchMarkerLng = lng;
      searchMarkerAddress = address || '';
      searchMarkerCalloutVisible = false;
      if (canvasOverlay && canvasOverlay.getMap()) {
        canvasOverlay.draw();
        actualDraw(canvasOverlay);
      }
    }

    function clearSearchMarker() {
      searchMarkerLat = null;
      searchMarkerLng = null;
      searchMarkerAddress = '';
      searchMarkerCalloutVisible = false;
      window._searchMarkerHit = null;
      if (canvasOverlay && canvasOverlay.getMap()) {
        canvasOverlay.draw();
        actualDraw(canvasOverlay);
      }
    }

    // ── Polygon math helpers ──
    function rotatePoint(px, py, cx, cy, angle) {
      var cos = Math.cos(angle), sin = Math.sin(angle);
      return { x: cx + (px - cx) * cos - (py - cy) * sin, y: cy + (px - cx) * sin + (py - cy) * cos };
    }

    function getPolygonCenterPx(cornersPx) {
      var cx = 0, cy = 0;
      for (var i = 0; i < cornersPx.length; i++) { cx += cornersPx[i].x; cy += cornersPx[i].y; }
      return { x: cx / cornersPx.length, y: cy / cornersPx.length };
    }

    function latLngToPx(lat, lng, pxPerLng, pxPerLat, swLng, neLat) {
      return { x: (lng - swLng) * pxPerLng, y: (lat - neLat) * pxPerLat };
    }

    function pxToLatLng(px, py, pxPerLng, pxPerLat, swLng, neLat) {
      return { lat: neLat + py / pxPerLat, lng: swLng + px / pxPerLng };
    }

    function getProjectionParams() {
      if (!canvasOverlay || !canvasOverlay.getMap()) return null;
      var map = canvasOverlay.getMap();
      var projection = canvasOverlay.getProjection();
      var bounds = map.getBounds();
      var ne = bounds.getNorthEast();
      var sw = bounds.getSouthWest();
      var nwLL = new kakao.maps.LatLng(ne.getLat(), sw.getLng());
      var seLL = new kakao.maps.LatLng(sw.getLat(), ne.getLng());
      var nwPt = projection.pointFromCoords(nwLL);
      var sePt = projection.pointFromCoords(seLL);
      return {
        pxPerLng: (sePt.x - nwPt.x) / (ne.getLng() - sw.getLng()),
        pxPerLat: (sePt.y - nwPt.y) / (sw.getLat() - ne.getLat()),
        swLng: sw.getLng(), neLat: ne.getLat(),
        swLat: sw.getLat(), neLng: ne.getLng()
      };
    }

    function polygonCornersToPx(corners, params) {
      var result = [];
      for (var i = 0; i < corners.length; i++) {
        result.push(latLngToPx(corners[i][0], corners[i][1], params.pxPerLng, params.pxPerLat, params.swLng, params.neLat));
      }
      return result;
    }

    function polygonPxToCorners(cornersPx, params) {
      var result = [];
      for (var i = 0; i < cornersPx.length; i++) {
        var ll = pxToLatLng(cornersPx[i].x, cornersPx[i].y, params.pxPerLng, params.pxPerLat, params.swLng, params.neLat);
        result.push([ll.lat, ll.lng]);
      }
      return result;
    }

    // ── Polygon drawing mode control ──
    function startPolygonDrawing(markerId) {
      isPolygonDrawingMode = true;
      polygonDrawingMarkerId = markerId;
      drawStartPx = null;
      drawCurrentPx = null;
      isDrawing = false;
      activeHandle = null;
      handleDragStart = null;

      // Load existing polygon if available
      if (markerPolygons[markerId]) {
        var saved = markerPolygons[markerId];
        var params = getProjectionParams();
        if (params) {
          var cPx = polygonCornersToPx(saved.corners, params);
          drawnPolygon = { corners: saved.corners.slice(), rotation: saved.rotation, cornersPx: cPx, centerPx: getPolygonCenterPx(cPx) };
        }
      } else {
        drawnPolygon = null;
      }

      // Disable map interaction
      kakaoMap.setDraggable(false);
      kakaoMap.setZoomable(false);

      if (canvasOverlay && canvasOverlay.getMap()) { canvasOverlay.draw(); actualDraw(canvasOverlay); }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'polygonDrawingStarted', markerId: markerId }));
    }

    function cancelPolygonDrawing() {
      isPolygonDrawingMode = false;
      polygonDrawingMarkerId = null;
      drawnPolygon = null;
      drawStartPx = null;
      drawCurrentPx = null;
      isDrawing = false;
      activeHandle = null;
      handleDragStart = null;

      kakaoMap.setDraggable(true);
      kakaoMap.setZoomable(true);

      if (canvasOverlay && canvasOverlay.getMap()) { canvasOverlay.draw(); actualDraw(canvasOverlay); }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'polygonDrawingCancelled' }));
    }

    function savePolygonDrawing() {
      if (!drawnPolygon || !polygonDrawingMarkerId) return;
      // Recompute corners from current pixel positions
      var params = getProjectionParams();
      if (params) {
        drawnPolygon.corners = polygonPxToCorners(drawnPolygon.cornersPx, params);
      }
      var saveData = { corners: drawnPolygon.corners, rotation: drawnPolygon.rotation };
      markerPolygons[polygonDrawingMarkerId] = saveData;
      // Invalidate cached payload key so the next setMarkerPolygons call compares against
      // current in-memory state rather than a stale serialized snapshot.
      markerPolygonsKey = '';

      var savedMarkerId = polygonDrawingMarkerId;
      isPolygonDrawingMode = false;
      polygonDrawingMarkerId = null;
      drawnPolygon = null;
      drawStartPx = null;
      drawCurrentPx = null;
      isDrawing = false;
      activeHandle = null;
      handleDragStart = null;

      kakaoMap.setDraggable(true);
      kakaoMap.setZoomable(true);

      if (canvasOverlay && canvasOverlay.getMap()) { canvasOverlay.draw(); actualDraw(canvasOverlay); }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'polygonSave', markerId: savedMarkerId, polygonData: saveData }));
    }

    function deletePolygonDrawing() {
      if (!polygonDrawingMarkerId) return;
      var deletedMarkerId = polygonDrawingMarkerId;
      delete markerPolygons[deletedMarkerId];
      markerPolygonsKey = '';

      isPolygonDrawingMode = false;
      polygonDrawingMarkerId = null;
      drawnPolygon = null;
      drawStartPx = null;
      drawCurrentPx = null;
      isDrawing = false;
      activeHandle = null;
      handleDragStart = null;

      kakaoMap.setDraggable(true);
      kakaoMap.setZoomable(true);

      if (canvasOverlay && canvasOverlay.getMap()) { canvasOverlay.draw(); actualDraw(canvasOverlay); }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'polygonDelete', markerId: deletedMarkerId }));
    }

    // Cached serialization so we can skip redraws when nothing actually changed.
    // Without this, viewport refetches push identical polygon data every bounds_changed tick
    // and each push forces a canvas redraw — visible as a flash when the bottom sheet opens
    // and map layout animates.
    function setPolygonsVisible(visible) {
      var next = !!visible;
      if (next === polygonsVisible) return;
      polygonsVisible = next;
      if (canvasOverlay && canvasOverlay.getMap()) { canvasOverlay.draw(); actualDraw(canvasOverlay); }
    }

    var markerPolygonsKey = '';
    function setMarkerPolygons(data) {
      var incoming = data || {};
      var nextKey;
      try { nextKey = JSON.stringify(incoming); } catch (_e) { nextKey = String(Math.random()); }
      if (nextKey === markerPolygonsKey) return; // no-op: identical payload
      markerPolygons = incoming;
      markerPolygonsKey = nextKey;
      if (canvasOverlay && canvasOverlay.getMap()) { canvasOverlay.draw(); actualDraw(canvasOverlay); }
    }

    // ── Polygon touch event handling ──
    // We use the map container's native touch events since Kakao click event only fires on tap, not drag
    (function setupPolygonTouchHandlers() {
      var mapContainer = null;

      function getMapContainer() {
        if (!mapContainer) mapContainer = document.getElementById('map');
        return mapContainer;
      }

      function getTouchPx(e) {
        var container = getMapContainer();
        if (!container) return null;
        var rect = container.getBoundingClientRect();
        var touch = e.touches ? e.touches[0] : e;
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }

      function hitTestHandle(px) {
        if (!drawnPolygon || !drawnPolygon.cornersPx) return null;
        var HANDLE_HIT = 24;
        var labels = ['tl', 'tr', 'br', 'bl'];
        for (var i = 0; i < drawnPolygon.cornersPx.length; i++) {
          var c = drawnPolygon.cornersPx[i];
          if (Math.abs(px.x - c.x) < HANDLE_HIT && Math.abs(px.y - c.y) < HANDLE_HIT) return labels[i];
        }
        // Rotation handle: bottom-right corner, fixed 28px outside (must match render)
        var br = drawnPolygon.cornersPx[2];
        var center = drawnPolygon.centerPx;
        var rDx = br.x - center.x; var rDy = br.y - center.y;
        var rLen = Math.sqrt(rDx * rDx + rDy * rDy) || 1;
        var rotHandleX = br.x + (rDx / rLen) * 28;
        var rotHandleY = br.y + (rDy / rLen) * 28;
        if (Math.abs(px.x - rotHandleX) < HANDLE_HIT && Math.abs(px.y - rotHandleY) < HANDLE_HIT) return 'rotate';
        return null;
      }

      function hitTestCloseBtn(px) {
        if (!drawnPolygon || !drawnPolygon.cornersPx) return false;
        // Close button at top-right corner offset
        var tr = drawnPolygon.cornersPx[1];
        var center = drawnPolygon.centerPx;
        var cDx = tr.x - center.x; var cDy = tr.y - center.y;
        var cLen = Math.sqrt(cDx * cDx + cDy * cDy) || 1;
        var closeCx = tr.x + (cDx / cLen) * 28;
        var closeCy = tr.y + (cDy / cLen) * 28;
        return Math.abs(px.x - closeCx) < 18 && Math.abs(px.y - closeCy) < 18;
      }

      // Point-in-polygon test using ray casting algorithm
      function hitTestPolygonBody(px) {
        if (!drawnPolygon || !drawnPolygon.cornersPx || drawnPolygon.cornersPx.length < 3) return false;
        var pts = drawnPolygon.cornersPx;
        var inside = false;
        for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          var xi = pts[i].x, yi = pts[i].y;
          var xj = pts[j].x, yj = pts[j].y;
          if (((yi > px.y) !== (yj > px.y)) && (px.x < (xj - xi) * (px.y - yi) / (yj - yi) + xi)) {
            inside = !inside;
          }
        }
        return inside;
      }

      function onTouchStart(e) {
        if (!isPolygonDrawingMode) return;
        var px = getTouchPx(e);
        if (!px) return;

        // Check close button first
        if (drawnPolygon && hitTestCloseBtn(px)) {
          cancelPolygonDrawing();
          return;
        }

        // Check handles on existing polygon
        if (drawnPolygon) {
          var handle = hitTestHandle(px);
          if (handle) {
            e.preventDefault();
            e.stopPropagation();
            activeHandle = handle;
            if (handle === 'rotate') {
              var center = drawnPolygon.centerPx;
              handleDragStart = {
                angle: Math.atan2(px.y - center.y, px.x - center.x),
                rotation: drawnPolygon.rotation
              };
            } else {
              // Resize: snapshot current half-extents and touch position
              var rc = drawnPolygon.centerPx;
              var rot0 = drawnPolygon.rotation;
              // Compute current hw/hh from any corner in local space
              var uCorner0 = rotatePoint(drawnPolygon.cornersPx[2].x, drawnPolygon.cornersPx[2].y, rc.x, rc.y, -rot0);
              handleDragStart = {
                startX: px.x, startY: px.y,
                hw: Math.abs(uCorner0.x - rc.x),
                hh: Math.abs(uCorner0.y - rc.y)
              };
            }
            return;
          }

          // Check if touch is inside polygon body — start move drag
          if (hitTestPolygonBody(px)) {
            e.preventDefault();
            e.stopPropagation();
            activeHandle = 'move';
            handleDragStart = { startX: px.x, startY: px.y };
            return;
          }
        }

        // Start new drawing if no polygon yet
        if (!drawnPolygon) {
          e.preventDefault();
          e.stopPropagation();
          drawStartPx = px;
          drawCurrentPx = px;
          isDrawing = true;
        }
      }

      function onTouchMove(e) {
        if (!isPolygonDrawingMode) return;
        var px = getTouchPx(e);
        if (!px) return;

        if (isDrawing && drawStartPx) {
          e.preventDefault();
          e.stopPropagation();
          drawCurrentPx = px;
          if (canvasOverlay && canvasOverlay.getMap()) actualDraw(canvasOverlay);
          return;
        }

        if (activeHandle && drawnPolygon) {
          e.preventDefault();
          e.stopPropagation();
          var center = drawnPolygon.centerPx;

          if (activeHandle === 'move') {
            var mdx = px.x - handleDragStart.startX;
            var mdy = px.y - handleDragStart.startY;
            for (var mi = 0; mi < drawnPolygon.cornersPx.length; mi++) {
              drawnPolygon.cornersPx[mi] = { x: drawnPolygon.cornersPx[mi].x + mdx, y: drawnPolygon.cornersPx[mi].y + mdy };
            }
            drawnPolygon.centerPx = { x: drawnPolygon.centerPx.x + mdx, y: drawnPolygon.centerPx.y + mdy };
            handleDragStart.startX = px.x;
            handleDragStart.startY = px.y;
          } else if (activeHandle === 'rotate') {
            var newAngle = Math.atan2(px.y - center.y, px.x - center.x);
            // Incremental delta with damping for smoother control
            var rawDelta = newAngle - handleDragStart.angle;
            // Normalize to [-PI, PI] to avoid jumps when crossing ±180°
            while (rawDelta > Math.PI) rawDelta -= 2 * Math.PI;
            while (rawDelta < -Math.PI) rawDelta += 2 * Math.PI;
            var dampedDelta = rawDelta * 0.45;
            var prevRotation = drawnPolygon.rotation;
            drawnPolygon.rotation = prevRotation + dampedDelta;
            // Update start angle for next frame (incremental tracking)
            handleDragStart.angle = newAngle;
            // Recompute corner pixels: rotate all corners by dampedDelta around center
            var newCorners = [];
            for (var j = 0; j < drawnPolygon.cornersPx.length; j++) {
              newCorners.push(rotatePoint(drawnPolygon.cornersPx[j].x, drawnPolygon.cornersPx[j].y, center.x, center.y, dampedDelta));
            }
            drawnPolygon.cornersPx = newCorners;
            drawnPolygon.centerPx = getPolygonCenterPx(newCorners);
          } else {
            // Resize: center is fixed anchor, grow/shrink by delta from touch start
            var rot = drawnPolygon.rotation;
            // Compute drag delta in local (unrotated) space
            var uCur = rotatePoint(px.x, px.y, center.x, center.y, -rot);
            var uStart = rotatePoint(handleDragStart.startX, handleDragStart.startY, center.x, center.y, -rot);
            var ddx = uCur.x - uStart.x;
            var ddy = uCur.y - uStart.y;
            // Determine which quadrant the dragged corner is in, to apply delta sign correctly
            var uC0 = rotatePoint(drawnPolygon.cornersPx[{ tl:0, tr:1, br:2, bl:3 }[activeHandle]].x,
                                  drawnPolygon.cornersPx[{ tl:0, tr:1, br:2, bl:3 }[activeHandle]].y,
                                  center.x, center.y, -rot);
            var signX = uC0.x >= center.x ? 1 : -1;
            var signY = uC0.y >= center.y ? 1 : -1;
            var hw = Math.max(10, handleDragStart.hw + signX * ddx);
            var hh = Math.max(10, handleDragStart.hh + signY * ddy);
            // Build unrotated rect centered at center
            var uCorners = [
              { x: center.x - hw, y: center.y - hh },
              { x: center.x + hw, y: center.y - hh },
              { x: center.x + hw, y: center.y + hh },
              { x: center.x - hw, y: center.y + hh }
            ];
            // Re-apply rotation around the fixed center
            var rCorners = [];
            for (var k = 0; k < uCorners.length; k++) {
              rCorners.push(rotatePoint(uCorners[k].x, uCorners[k].y, center.x, center.y, rot));
            }
            drawnPolygon.cornersPx = rCorners;
            drawnPolygon.centerPx = center;
          }

          if (canvasOverlay && canvasOverlay.getMap()) actualDraw(canvasOverlay);
        }
      }

      function onTouchEnd(e) {
        if (!isPolygonDrawingMode) return;

        if (isDrawing && drawStartPx && drawCurrentPx) {
          var dx = drawCurrentPx.x - drawStartPx.x;
          var dy = drawCurrentPx.y - drawStartPx.y;
          var size = Math.sqrt(dx * dx + dy * dy);

          if (size > 15) {
            // Create rectangle from draw start/end
            var minX = Math.min(drawStartPx.x, drawCurrentPx.x);
            var maxX = Math.max(drawStartPx.x, drawCurrentPx.x);
            var minY = Math.min(drawStartPx.y, drawCurrentPx.y);
            var maxY = Math.max(drawStartPx.y, drawCurrentPx.y);

            var cPx = [
              { x: minX, y: minY }, { x: maxX, y: minY },
              { x: maxX, y: maxY }, { x: minX, y: maxY }
            ];

            var params = getProjectionParams();
            var corners = params ? polygonPxToCorners(cPx, params) : [[0,0],[0,0],[0,0],[0,0]];

            drawnPolygon = {
              corners: corners,
              rotation: 0,
              cornersPx: cPx,
              centerPx: getPolygonCenterPx(cPx)
            };
          }

          drawStartPx = null;
          drawCurrentPx = null;
          isDrawing = false;
          if (canvasOverlay && canvasOverlay.getMap()) actualDraw(canvasOverlay);
          return;
        }

        if (activeHandle) {
          activeHandle = null;
          handleDragStart = null;
          // Update lat/lng corners from pixel positions
          var params2 = getProjectionParams();
          if (params2 && drawnPolygon) {
            drawnPolygon.corners = polygonPxToCorners(drawnPolygon.cornersPx, params2);
          }
        }
      }

      // Attach to map container after Kakao loads
      setTimeout(function attachTouchHandlers() {
        var container = getMapContainer();
        if (container) {
          container.addEventListener('touchstart', onTouchStart, { passive: false });
          container.addEventListener('touchmove', onTouchMove, { passive: false });
          container.addEventListener('touchend', onTouchEnd, { passive: false });
          // Also mouse events for testing in browser
          container.addEventListener('mousedown', function(e) { onTouchStart({ touches: [e], preventDefault: function(){}, stopPropagation: function(){} }); });
          container.addEventListener('mousemove', function(e) { if (isDrawing || activeHandle) onTouchMove({ touches: [e], preventDefault: function(){e.preventDefault();}, stopPropagation: function(){e.stopPropagation();} }); });
          container.addEventListener('mouseup', function(e) { onTouchEnd({ preventDefault: function(){}, stopPropagation: function(){} }); });
        } else {
          setTimeout(attachTouchHandlers, 200);
        }
      }, 300);
    })();

    // ── Selection management ──
    function selectMarker(markerId) {
      selectedMarkerId = markerId;
      selectedMarkerIsConfirmed = false;
      var allData = [].concat(legalDayData, illegalDayData, legalNightData, illegalNightData);
      for (var i = 0; i < allData.length; i++) {
        if (allData[i].id === markerId) {
          selectedMarkerLat = allData[i].lat;
          selectedMarkerLng = allData[i].lng;
          selectedMarkerSubType = allData[i].onStreetSubType || 'on_street_legal_day';
          selectedMarkerIsConfirmed = !!allData[i].isConfirmed;
          break;
        }
      }
      if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
    }

    function selectMarkerAt(markerId, lat, lng, subType) {
      selectedMarkerId = markerId;
      selectedMarkerLat = lat;
      selectedMarkerLng = lng;
      selectedMarkerSubType = subType || 'on_street_legal_day';
      selectedMarkerIsConfirmed = false;
      var allData = [].concat(legalDayData, illegalDayData, legalNightData, illegalNightData);
      for (var i = 0; i < allData.length; i++) {
        if (allData[i].id === markerId) {
          selectedMarkerIsConfirmed = !!allData[i].isConfirmed;
          break;
        }
      }
      bottomSheetVisible = true;
      if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
    }

    // Update only the sub-type of the currently selected marker and redraw
    function updateSelectedMarkerSubType(subType) {
      if (selectedMarkerId === null) return;
      selectedMarkerSubType = subType || 'on_street_legal_day';
      if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
    }

    function deselectMarker() {
      if (selectedMarkerId === null) return;
      selectedMarkerId = null;
      selectedMarkerLat = 0;
      selectedMarkerLng = 0;
      selectedMarkerSubType = null;
      selectedMarkerIsConfirmed = false;
      bottomSheetVisible = false;
      if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
    }

    function setBottomSheetVisible(visible) {
      bottomSheetVisible = visible;
      if (canvasOverlay && canvasOverlay.getMap()) {
        canvasOverlay.draw();
        actualDraw(canvasOverlay);
      }
    }

    // ── Set markers: split into typed arrays by on-street sub-type ──
    // All markers are categorized by sub-type only (no updated/createdByApp distinction)
    function setMarkers(markers) {
      // Preserve selection when bottom sheet is open (pan/zoom should not deselect)
      var prevSelectedId = bottomSheetVisible ? selectedMarkerId : null;
      var prevSelectedLat = bottomSheetVisible ? selectedMarkerLat : 0;
      var prevSelectedLng = bottomSheetVisible ? selectedMarkerLng : 0;
      var prevSelectedType = bottomSheetVisible ? selectedMarkerSubType : null;
      selectedMarkerId = null;

      var ldCoords = [], idCoords = [], lnCoords = [], inCoords = [];
      var ldData = [], idData = [], lnData = [], inData = [];

      for (var i = 0; i < markers.length; i++) {
        var m = markers[i];
        var subType = m.onStreetSubType || 'on_street_legal_day';
        switch (subType) {
          case 'on_street_illegal_day':
            idCoords.push(m.lat, m.lng);
            idData.push(m);
            break;
          case 'on_street_legal_night':
            lnCoords.push(m.lat, m.lng);
            lnData.push(m);
            break;
          case 'on_street_illegal_night':
            inCoords.push(m.lat, m.lng);
            inData.push(m);
            break;
          default: // on_street_legal_day
            ldCoords.push(m.lat, m.lng);
            ldData.push(m);
            break;
        }
      }

      legalDayArr = new Float64Array(ldCoords);
      illegalDayArr = new Float64Array(idCoords);
      legalNightArr = new Float64Array(lnCoords);
      illegalNightArr = new Float64Array(inCoords);
      legalDayData = ldData;
      illegalDayData = idData;
      legalNightData = lnData;
      illegalNightData = inData;

      // Restore selection if bottom sheet was open
      if (prevSelectedId !== null) {
        selectedMarkerId = prevSelectedId;
        selectedMarkerLat = prevSelectedLat;
        selectedMarkerLng = prevSelectedLng;
        selectedMarkerSubType = prevSelectedType;
        // Refresh isConfirmed flag from the updated marker data
        selectedMarkerIsConfirmed = false;
        var restoredAll = [].concat(legalDayData, illegalDayData, legalNightData, illegalNightData);
        for (var r = 0; r < restoredAll.length; r++) {
          if (restoredAll[r].id === prevSelectedId) {
            selectedMarkerIsConfirmed = !!restoredAll[r].isConfirmed;
            break;
          }
        }
      }

      if (canvasOverlay && canvasOverlay.getMap()) {
        canvasOverlay.draw();
        actualDraw(canvasOverlay);
      }
    }

    // ── Zone boundary polygons — canvas-based rendering with bitmap caching ──
    var zoneCanvas = null;
    var zoneCtx = null;
    var zoneOverlay = null;
    var zonePolygonData = [];
    var zoneLabelsVisible = false;
    var zoneRafId = 0;
    var zoneRenderOriginX = 0;
    var zoneRenderOriginY = 0;
    var zoneRenderLevel = -1;
    var zoneHasRendered = false;
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

      zoneOverlay.draw = function() {
        var map = this.getMap();
        if (!map || zonePolygonData.length === 0) {
          zoneCanvas.width = 0;
          zoneCanvas.height = 0;
          zoneHasRendered = false;
          return;
        }
        if (!zoneHasRendered) {
          fullRenderZones(overlayRef);
          return;
        }
        zoneCanvas.style.left = zoneRenderOriginX + 'px';
        zoneCanvas.style.top = zoneRenderOriginY + 'px';
      };

      zoneOverlay.setMap(kakaoMap);

      kakao.maps.event.addListener(kakaoMap, 'idle', function() {
        if (zonePolygonData.length > 0 && zoneOverlay && zoneOverlay.getMap()) {
          fullRenderZones(zoneOverlay);
        }
      });
    }

    function fullRenderZones(overlay) {
      var map = overlay.getMap();
      if (!map || zonePolygonData.length === 0) return;
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

      var padW = viewW * ZONE_PAD;
      var padH = viewH * ZONE_PAD;
      var totalW = viewW + padW * 2;
      var totalH = viewH + padH * 2;

      var nwLL = new kakao.maps.LatLng(neLat, swLng);
      var nwPt = projection.pointFromCoords(nwLL);
      var canvasLeft = nwPt.x - padW;
      var canvasTop = nwPt.y - padH;

      var seLL = new kakao.maps.LatLng(swLat, neLng);
      var sePt = projection.pointFromCoords(seLL);

      var latRange = neLat - swLat;
      var lngRange = neLng - swLng;
      var padLat = latRange * ZONE_PAD;
      var padLng = lngRange * ZONE_PAD;
      var exSwLat = swLat - padLat;
      var exNeLat = neLat + padLat;
      var exSwLng = swLng - padLng;
      var exNeLng = neLng + padLng;

      var pxPerLng = (sePt.x - nwPt.x) / (neLng - swLng);
      var pxPerLat = (sePt.y - nwPt.y) / (swLat - neLat);

      zoneCanvas.style.left = canvasLeft + 'px';
      zoneCanvas.style.top = canvasTop + 'px';
      zoneCanvas.style.width = totalW + 'px';
      zoneCanvas.style.height = totalH + 'px';

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      zoneCanvas.width = totalW * dpr;
      zoneCanvas.height = totalH * dpr;
      zoneCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      zoneCtx.clearRect(0, 0, totalW, totalH);

      var offX = padW;
      var offY = padH;
      var zoomScale = Math.max(0.5, Math.min(1, Math.pow(2, 5 - level)));

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
          var cLng = (bbox.minLng + bbox.maxLng) / 2;
          var cLat = (bbox.minLat + bbox.maxLat) / 2;
          var cx = (cLng - swLng) * pxPerLng + offX;
          var cy = (cLat - neLat) * pxPerLat + offY;
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
          zoneCtx.fillStyle = '#EF4444';
          zoneCtx.fillText(name, cx, cy);
        }
      }

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
      zoneHasRendered = false;
      if (zoneOverlay && zoneOverlay.getMap()) {
        fullRenderZones(zoneOverlay);
      }
    }

    function setZoneLabelsVisible(visible) {
      zoneLabelsVisible = !!visible;
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
    window.updateSelectedMarkerSubType = updateSelectedMarkerSubType;
    window.deselectMarker = deselectMarker;
    window.setBottomSheetVisible = setBottomSheetVisible;
    window.setAddingMode = setAddingMode;
    window.clearNewMarker = clearNewMarker;
    window.setSearchMarker = setSearchMarker;
    window.clearSearchMarker = clearSearchMarker;
    window.startPolygonDrawing = startPolygonDrawing;
    window.cancelPolygonDrawing = cancelPolygonDrawing;
    window.savePolygonDrawing = savePolygonDrawing;
    window.deletePolygonDrawing = deletePolygonDrawing;
    window.setMarkerPolygons = setMarkerPolygons;
    window.setPolygonsVisible = setPolygonsVisible;
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
