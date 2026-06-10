import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';

import type { ScreenId, LocationDataPoint } from '@/src/api-contracts';
import { submitLocationTracking } from '@/src/api/location-tracking';

/** How often to collect GPS data (in milliseconds) */
const TRACKING_INTERVAL_MS = 30_000;

/** How many points to accumulate before sending a batch */
const BATCH_SIZE = 5;

/** Maximum buffer size before forcing a flush */
const MAX_BUFFER_SIZE = 20;

interface UseLocationTrackingOptions {
  /** The screen ID to tag location records with */
  screenId: ScreenId;
  /** Whether to enable tracking (default: true) */
  enabled?: boolean;
}

/**
 * Hook that tracks the user's GPS location every 30 seconds while the screen
 * is focused and the app is in the foreground. Sends data in batches to reduce
 * network calls.
 *
 * Anti-spoofing: sends isMock flag from device, accuracy, speed, heading, and
 * altitude for server-side validation.
 */
export function useLocationTracking({
  screenId,
  enabled = true,
}: UseLocationTrackingOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bufferRef = useRef<LocationDataPoint[]>([]);
  const isFocusedRef = useRef(false);
  const permissionRef = useRef<boolean | null>(null);

  // Flush buffered locations to the server
  const flushBuffer = useCallback(async () => {
    if (bufferRef.current.length === 0) return;

    const locations = [...bufferRef.current];
    bufferRef.current = [];

    try {
      await submitLocationTracking(screenId, {
        screenId,
        locations,
      });
    } catch {
      // On failure, put locations back into buffer for next attempt
      bufferRef.current = [...locations, ...bufferRef.current].slice(
        0,
        MAX_BUFFER_SIZE,
      );
    }
  }, [screenId]);

  // Collect a single GPS reading and add to buffer
  const collectLocation = useCallback(async () => {
    if (permissionRef.current !== true) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      permissionRef.current = status === 'granted';
    }

    if (!permissionRef.current) return;

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const dataPoint: LocationDataPoint = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        isMock: (loc as { mocked?: boolean }).mocked ?? false,
        clientTimestamp: Math.floor(loc.timestamp / 1000),
      };

      bufferRef.current.push(dataPoint);

      // Flush when batch size reached
      if (bufferRef.current.length >= BATCH_SIZE) {
        await flushBuffer();
      }
    } catch {
      // Location unavailable — skip this tick silently
    }
  }, [flushBuffer]);

  // Start the tracking interval
  const startTracking = useCallback(() => {
    if (intervalRef.current) return;

    // Collect immediately, then every TRACKING_INTERVAL_MS
    collectLocation();
    intervalRef.current = setInterval(collectLocation, TRACKING_INTERVAL_MS);
  }, [collectLocation]);

  // Stop the tracking interval and flush remaining data
  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Flush any remaining buffered locations
    flushBuffer();
  }, [flushBuffer]);

  // Track focus/blur of the screen
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      if (enabled) {
        startTracking();
      }

      return () => {
        isFocusedRef.current = false;
        stopTracking();
      };
    }, [enabled, startTracking, stopTracking]),
  );

  // Pause/resume when app goes to background/foreground
  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isFocusedRef.current) {
        startTracking();
      } else if (nextState !== 'active') {
        stopTracking();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Final flush
      if (bufferRef.current.length > 0) {
        const remaining = [...bufferRef.current];
        bufferRef.current = [];
        submitLocationTracking(screenId, {
          screenId,
          locations: remaining,
        }).catch(() => {
          // Best effort — ignore errors on unmount
        });
      }
    };
  }, [screenId]);
}
