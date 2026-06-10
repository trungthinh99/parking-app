import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

// Types for street parking markers on the map
export interface StreetParkingMarker {
  id: string;
  lat: number;
  lng: number;
  type: "pending" | "completed";
  label?: string;
  /** Marker mode: "new" = create new survey, "existing" = edit existing */
  mode?: "new" | "existing";
  /** Whether this marker has been manually updated — renders as solid red (#D00000) */
  isUpdated?: boolean;
  /** Whether this marker was created via app field survey — renders as solid green (#10A571) */
  isCreatedByApp?: boolean;
  /** Whether this marker has been confirmed/completed by surveyor / 조사 확인 완료 여부 */
  isConfirmed?: boolean;
  /** Address */
  address?: string | null;
  /** Pre-derived survey area code (조사구역) for create mode — fills uniqueNumber1 */
  surveyArea?: string | null;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export interface StreetKakaoMapRef {
  moveToLocation: (lat: number, lng: number) => void;
  moveToLocationWithOffset: (lat: number, lng: number, offsetY: number) => void;
  setMarkers: (markers: StreetParkingMarker[]) => void;
  getCurrentLocation: () => void;
  selectMarker: (markerId: string) => void;
  selectMarkerAt: (markerId: string, lat: number, lng: number, markerType?: string) => void;
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
}

interface StreetKakaoMapProps {
  appKey: string;
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  markers?: StreetParkingMarker[];
  onMarkerPress?: (marker: StreetParkingMarker) => void;
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
 * KakaoMap component for street parking survey (노외주차장)
 * Uses canvas-based rendering with triangle markers for off_street type
 */
export const StreetKakaoMap = forwardRef<StreetKakaoMapRef, StreetKakaoMapProps>(
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
      setMarkers: (newMarkers: StreetParkingMarker[]) => {
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
            window.selectMarkerAt('${markerId}', ${lat}, ${lng}, '${markerType || 'existing'}');
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

    // Generate HTML content for Kakao Map with canvas-based triangle marker rendering
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

    // ── Marker style constants for street parking (triangle markers) ──
    var MARKER_STYLES = {
      existing:    { fill: '#FFFFFF', stroke: '#D00000', strokeWidth: 2 },
      updated:     { fill: '#D00000', stroke: 'none',   strokeWidth: 0 },
      createdByApp:{ fill: '#10A571', stroke: 'none',   strokeWidth: 0 }
    };

    // Zoom threshold: level <= this shows individual markers, > shows clusters
    var CLUSTER_ZOOM_THRESHOLD = 6;

    // ── Canvas overlay state ──
    // Typed arrays for fast iteration
    var existingArr = new Float64Array(0);
    var updatedArr = new Float64Array(0);
    var createdByAppArr = new Float64Array(0);

    // Original marker objects for hit-testing
    var existingData = [];
    var updatedData = [];
    var createdByAppData = [];

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
    var selectedMarkerType = null;
    var bottomSheetVisible = false;

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
        var total = existingArr.length + updatedArr.length + createdByAppArr.length;
        if (!map || total === 0) {
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

    // ── Individual triangle markers (zoomed in) ──
    function renderIndividualMarkers(pxPerLng, pxPerLat, swLat, swLng, neLat, neLng, width, height) {
      ctx.clearRect(0, 0, width, height);

      var SIZE = 14;
      var HALF = SIZE / 2;
      var PAD = SIZE;

      // Helper: draw typed array as triangles
      function drawTriangles(arr, colors) {
        if (arr.length === 0) return;

        var isOutline = (colors.stroke !== 'none' && colors.fill === '#FFFFFF');

        for (var i = 0; i < arr.length; i += 2) {
          var lat = arr[i], lng = arr[i + 1];
          if (selectedMarkerId !== null && lat === selectedMarkerLat && lng === selectedMarkerLng) continue;
          if (lat < swLat || lat > neLat || lng < swLng || lng > neLng) continue;
          var x = (lng - swLng) * pxPerLng;
          var y = (lat - neLat) * pxPerLat;
          if (x < -PAD || x > width + PAD || y < -PAD || y > height + PAD) continue;
          ctx.beginPath();
          ctx.moveTo(x, y - HALF);
          ctx.lineTo(x - HALF, y + HALF);
          ctx.lineTo(x + HALF, y + HALF);
          ctx.closePath();
          if (isOutline) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = colors.stroke;
            ctx.lineWidth = colors.strokeWidth;
            ctx.stroke();
          } else {
            ctx.fillStyle = colors.fill;
            ctx.fill();
          }
        }
      }

      drawTriangles(existingArr, MARKER_STYLES.existing);
      drawTriangles(updatedArr, MARKER_STYLES.updated);
      drawTriangles(createdByAppArr, MARKER_STYLES.createdByApp);

      // Draw selected marker LAST so it renders on top of all other markers
      if (selectedMarkerId !== null) {
        var sLat = selectedMarkerLat;
        var sLng = selectedMarkerLng;
        if (sLat >= swLat && sLat <= neLat && sLng >= swLng && sLng <= neLng) {
          var sx = (sLng - swLng) * pxPerLng;
          var sy = (sLat - neLat) * pxPerLat;
          var selColors = MARKER_STYLES[selectedMarkerType] || MARKER_STYLES.existing;
          var SEL_SIZE = 28;
          var SEL_HALF = SEL_SIZE / 2;

          // Scaled-up triangle with shadow
          ctx.beginPath();
          ctx.moveTo(sx, sy - SEL_HALF);
          ctx.lineTo(sx - SEL_HALF, sy + SEL_HALF);
          ctx.lineTo(sx + SEL_HALF, sy + SEL_HALF);
          ctx.closePath();
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 6;
          if (selColors.stroke !== 'none' && selColors.fill === '#FFFFFF') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.strokeStyle = selColors.stroke;
            ctx.lineWidth = selColors.strokeWidth;
            ctx.stroke();
          } else {
            ctx.fillStyle = selColors.fill;
            ctx.fill();
          }
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }

      // Draw temporary new marker in adding mode (scaled-up green triangle, no white border)
      if (newMarkerLat !== null && newMarkerLng !== null) {
        var nx = (newMarkerLng - swLng) * pxPerLng;
        var ny = (newMarkerLat - neLat) * pxPerLat;
        var NEW_SIZE = 22;
        var NEW_HALF = NEW_SIZE / 2;
        ctx.beginPath();
        ctx.moveTo(nx, ny - NEW_HALF);
        ctx.lineTo(nx - NEW_HALF, ny + NEW_HALF);
        ctx.lineTo(nx + NEW_HALF, ny + NEW_HALF);
        ctx.closePath();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#10A571';
        ctx.fill();
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
    }

    // ── Cluster rendering (zoomed out) ──
    function renderClusters(pxPerLng, pxPerLat, swLat, swLng, neLat, neLng, width, height, level) {
      ctx.clearRect(0, 0, width, height);

      var gridLat = 0.018 * Math.pow(2, Math.max(0, level - CLUSTER_ZOOM_THRESHOLD - 1));
      var gridLng = 0.022 * Math.pow(2, Math.max(0, level - CLUSTER_ZOOM_THRESHOLD - 1));

      var configs = [
        { arr: existingArr,      type: 'existing',      oLat: 0,               oLng: 0 },
        { arr: updatedArr,       type: 'updated',       oLat: gridLat * 0.33,  oLng: gridLng * 0.17 },
        { arr: createdByAppArr,  type: 'createdByApp',  oLat: gridLat * 0.67,  oLng: gridLng * 0.5 }
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
        var clColors = MARKER_STYLES[cl.markerType] || MARKER_STYLES.existing;
        var isOutline = (cl.markerType === 'existing');
        var clColor = isOutline ? clColors.stroke : clColors.fill;

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
        { arr: existingArr,      data: existingData },
        { arr: updatedArr,       data: updatedData },
        { arr: createdByAppArr,  data: createdByAppData }
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

    // ── Selection management ──
    function selectMarker(markerId) {
      selectedMarkerId = markerId;
      var allData = [].concat(existingData, updatedData, createdByAppData);
      for (var i = 0; i < allData.length; i++) {
        if (allData[i].id === markerId) {
          selectedMarkerLat = allData[i].lat;
          selectedMarkerLng = allData[i].lng;
          selectedMarkerType = allData[i].isCreatedByApp ? 'createdByApp'
            : allData[i].isUpdated ? 'updated'
            : 'existing';
          break;
        }
      }
      if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
    }

    function selectMarkerAt(markerId, lat, lng, markerType) {
      selectedMarkerId = markerId;
      selectedMarkerLat = lat;
      selectedMarkerLng = lng;
      selectedMarkerType = markerType || 'existing';
      bottomSheetVisible = true;
      if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
    }

    function deselectMarker() {
      if (selectedMarkerId === null) return;
      selectedMarkerId = null;
      selectedMarkerLat = 0;
      selectedMarkerLng = 0;
      selectedMarkerType = null;
      bottomSheetVisible = false;
      if (canvasOverlay && canvasOverlay.getMap()) canvasOverlay.draw();
    }

    function setBottomSheetVisible(visible) {
      bottomSheetVisible = visible;
    }

    // ── Set markers: split into typed arrays by status ──
    function setMarkers(markers) {
      // Preserve selection when bottom sheet is open (pan/zoom should not deselect)
      var prevSelectedId = bottomSheetVisible ? selectedMarkerId : null;
      var prevSelectedLat = bottomSheetVisible ? selectedMarkerLat : 0;
      var prevSelectedLng = bottomSheetVisible ? selectedMarkerLng : 0;
      var prevSelectedType = bottomSheetVisible ? selectedMarkerType : null;
      selectedMarkerId = null;

      var eCoords = [], uCoords = [], cCoords = [];
      var eData = [], uData = [], cData = [];

      for (var i = 0; i < markers.length; i++) {
        var m = markers[i];
        if (m.isCreatedByApp) {
          cCoords.push(m.lat, m.lng);
          cData.push(m);
        } else if (m.isUpdated) {
          uCoords.push(m.lat, m.lng);
          uData.push(m);
        } else {
          eCoords.push(m.lat, m.lng);
          eData.push(m);
        }
      }

      existingArr = new Float64Array(eCoords);
      updatedArr = new Float64Array(uCoords);
      createdByAppArr = new Float64Array(cCoords);
      existingData = eData;
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
    window.deselectMarker = deselectMarker;
    window.setBottomSheetVisible = setBottomSheetVisible;
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
