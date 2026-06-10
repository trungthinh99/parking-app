import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewToken,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloseCircle } from "iconsax-react-native";

import { Text } from "@/src/components/Text";

interface PhotoLightboxProps {
  /** When true, the modal is shown and starts at initialIndex */
  visible: boolean;
  /** Image URIs (uploaded resolved server URL or pending local file URI) */
  uris: string[];
  /** Initial photo to display when opening */
  initialIndex: number;
  onClose: () => void;
}

/**
 * Fullscreen photo viewer with horizontal paging (swipe between photos)
 * and a close button at the top-right corner.
 */
export function PhotoLightbox({ visible, uris, initialIndex, onClose }: PhotoLightboxProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<string>>(null);
  const [width, setWidth] = useState(() => Dimensions.get("window").width);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Re-sync index whenever the modal opens at a new starting photo
  useEffect(() => {
    if (visible) setCurrentIndex(initialIndex);
  }, [visible, initialIndex]);

  // After mount, jump to the requested initial index without animation
  // (FlatList honors initialScrollIndex but combine with width changes is brittle on Android)
  const handleListLayout = useCallback(() => {
    if (initialIndex > 0 && listRef.current) {
      listRef.current.scrollToIndex({ index: initialIndex, animated: false });
    }
  }, [initialIndex]);

  // Track the active page for the "n / total" pager hint
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setCurrentIndex(first.index);
  });
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  // Fallback for Android — sometimes onViewableItemsChanged misses fast swipes
  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      if (index !== currentIndex && index >= 0 && index < uris.length) {
        setCurrentIndex(index);
      }
    },
    [width, currentIndex, uris.length],
  );

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={[styles.page, { width }]}>
        <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
      </View>
    ),
    [width],
  );

  if (!visible || uris.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={["portrait"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View
        style={styles.backdrop}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        <FlatList
          ref={listRef}
          data={uris}
          keyExtractor={(uri, idx) => `${idx}_${uri}`}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onScrollToIndexFailed={({ index }) => {
            // Retry after layout settles
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index, animated: false });
            }, 50);
          }}
          onLayout={handleListLayout}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig}
          onMomentumScrollEnd={onMomentumScrollEnd}
        />

        {/* Pager indicator (e.g. "2 / 5") — only when more than one photo */}
        {uris.length > 1 && (
          <View style={[styles.pagerWrap, { top: insets.top + 16 }]}>
            <Text style={styles.pagerText}>{`${currentIndex + 1} / ${uris.length}`}</Text>
          </View>
        )}

        {/* Close button — top right */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 8 }]}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <CloseCircle size={32} color="#FFFFFF" variant="Bold" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000000",
  },
  page: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  pagerWrap: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pagerText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
