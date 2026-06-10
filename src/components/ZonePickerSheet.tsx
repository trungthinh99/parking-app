import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/src/components/Text";
import type { SurveyZone } from "@/src/api-contracts";

const ANIMATION_DURATION = 300;

interface ZonePickerSheetProps {
  visible: boolean;
  zones: SurveyZone[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function ZonePickerSheet({
  visible,
  zones,
  selectedId,
  onSelect,
  onClose,
}: ZonePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    translateY.value = withTiming(400, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) });
    backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) });
    setTimeout(onClose, ANIMATION_DURATION);
  }, [onClose, translateY, backdropOpacity]);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) });
    }
  }, [visible, backdropOpacity, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  // Sort zones: group by region, then ascending by numeric zoneCode
  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) => {
      const regionCmp = a.region.localeCompare(b.region, "ko");
      if (regionCmp !== 0) return regionCmp;
      return (parseInt(a.zoneCode, 10) || 0) - (parseInt(b.zoneCode, 10) || 0);
    });
  }, [zones]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdropContainer, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          {Platform.OS === "ios" ? (
            <BlurView intensity={14} tint="dark" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView" />
          ) : null}
          <View style={styles.backdropDimming} />
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.pickerSheet, sheetStyle, { paddingBottom: insets.bottom }]}>
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
        <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
          <Pressable
            style={[styles.pickerItem, !selectedId && styles.pickerItemSelected]}
            onPress={() => { onSelect(""); handleClose(); }}
          >
            <Text style={[styles.pickerItemText, !selectedId && styles.pickerItemTextSelected]}>
              선택 안함
            </Text>
          </Pressable>
          {sortedZones.map((zone) => (
            <Pressable
              key={zone.featureId}
              style={[styles.pickerItem, selectedId === zone.featureId && styles.pickerItemSelected]}
              onPress={() => { onSelect(zone.featureId); handleClose(); }}
            >
              <Text style={[styles.pickerItemText, selectedId === zone.featureId && styles.pickerItemTextSelected]}>
                {zone.displayName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDimming: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === "ios" ? "rgba(21, 21, 21, 0.6)" : "rgba(21, 21, 21, 0.82)",
  },
  handleContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  handle: {
    width: 50,
    height: 6,
    borderRadius: 100,
    backgroundColor: "#E9E9E9",
  },
  pickerSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: "60%",
  },
  pickerScroll: {
    maxHeight: 320,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: "center",
  },
  pickerItemSelected: {},
  pickerItemText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#151515",
    textAlign: "center",
  },
  pickerItemTextSelected: {
    fontWeight: "600",
    color: "#238AAF",
  },
});
