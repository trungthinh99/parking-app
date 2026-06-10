import { ArrowLeft2, CloseCircle, Gps, Location } from "iconsax-react-native";
import IconSearchBlack from "@/src/assets/images/icons/icon-search-black.svg";
import React, { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { SlideInRight, SlideOutRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/src/components/Text";
import { useKakaoAddressSearch, type KakaoSearchResult } from "@/src/hooks/useKakaoAddressSearch";

interface SearchOverlayProps {
  visible: boolean;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onBack: () => void;
  onGpsPress: () => void;
  /** Called when user selects an address result */
  onSelectResult?: (result: KakaoSearchResult) => void;
}

/**
 * Fullscreen search overlay that slides in from the right.
 * Integrates Kakao Local API for real-time address/keyword search.
 */
export function SearchOverlay({
  visible,
  searchQuery,
  onSearchChange,
  onBack,
  onGpsPress,
  onSelectResult,
}: SearchOverlayProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const { results, isSearching } = useKakaoAddressSearch(visible ? searchQuery : "");

  // Auto-focus the input when overlay becomes visible
  useEffect(() => {
    if (visible) {
      // Small delay to ensure the animation has started and the input is mounted
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClear = useCallback(() => {
    onSearchChange("");
    inputRef.current?.focus();
  }, [onSearchChange]);

  // Highlight the matched query portion in the address text
  const highlightMatch = useCallback(
    (text: string) => {
      if (!searchQuery.trim()) {
        return <Text style={styles.resultAddress}>{text}</Text>;
      }

      const lowerText = text.toLowerCase();
      const lowerQuery = searchQuery.trim().toLowerCase();
      const idx = lowerText.indexOf(lowerQuery);

      if (idx === -1) {
        return <Text style={styles.resultAddress}>{text}</Text>;
      }

      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + searchQuery.trim().length);
      const after = text.slice(idx + searchQuery.trim().length);

      return (
        <Text style={styles.resultAddress}>
          {before ? <Text>{before}</Text> : null}
          <Text style={styles.resultHighlight}>{match}</Text>
          {after ? <Text>{after}</Text> : null}
        </Text>
      );
    },
    [searchQuery]
  );

  const renderItem = useCallback(
    ({ item }: { item: KakaoSearchResult }) => (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => onSelectResult?.(item)}
        activeOpacity={0.6}
      >
        <View style={styles.resultIconContainer}>
          <Location size={18} color="#BDBDBD" variant="Bold" />
        </View>
        <View style={styles.resultTextContainer}>
          {item.placeName ? (
            <>
              <Text style={styles.resultPlaceName} numberOfLines={1}>
                {item.placeName}
              </Text>
              {highlightMatch(item.roadAddress || item.jibunAddress)}
            </>
          ) : (
            highlightMatch(item.roadAddress || item.jibunAddress)
          )}
          {item.roadAddress && item.jibunAddress && item.roadAddress !== item.jibunAddress && (
            <Text style={styles.resultJibun} numberOfLines={1}>
              {item.jibunAddress}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    ),
    [onSelectResult, highlightMatch]
  );

  const keyExtractor = useCallback((item: KakaoSearchResult) => item.id, []);

  const renderEmpty = useCallback(() => {
    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>검색할 주소를 입력하세요</Text>
        </View>
      );
    }
    if (isSearching) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
      </View>
    );
  }, [searchQuery, isSearching]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInRight.duration(250)}
      exiting={SlideOutRight.duration(200)}
      style={[styles.overlay, { paddingTop: insets.top }]}
    >
      {/* Search header */}
      <View style={styles.header}>
        {/* Back button */}
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
        >
          <ArrowLeft2 size={24} color="#151515" variant="Linear" />
        </TouchableOpacity>

        {/* Search input */}
        <View style={styles.searchBarContainer}>
          <IconSearchBlack width={14} height={14} />
          <TextInput
            ref={inputRef}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="검색할 주소를 입력하세요"
            placeholderTextColor="#BDBDBD"
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <CloseCircle size={16} color="#BDBDBD" variant="Bold" />
            </TouchableOpacity>
          )}
        </View>

        {/* GPS button */}
        <TouchableOpacity onPress={onGpsPress} activeOpacity={0.7} style={styles.gpsButton}>
          <Gps size={16} color="#151515" variant="Linear" />
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isSearching && searchQuery.trim().length > 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#238AAF" />
        </View>
      )}

      {/* Search results */}
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.resultsList}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    zIndex: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBarContainer: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#F4F4F4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#151515",
    fontFamily: "Pretendard-Regular",
    paddingVertical: 0,
    includeFontPadding: false,
    letterSpacing: -0.308,
  },
  gpsButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#151515",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  loadingContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  resultIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  resultTextContainer: {
    flex: 1,
    gap: 2,
  },
  resultPlaceName: {
    fontFamily: "Pretendard-SemiBold",
    fontSize: 15,
    color: "#151515",
    letterSpacing: -0.33,
    lineHeight: 21,
  },
  resultAddress: {
    fontFamily: "Pretendard-Regular",
    fontSize: 14,
    color: "#555555",
    letterSpacing: -0.308,
    lineHeight: 20,
  },
  resultHighlight: {
    fontFamily: "Pretendard-Medium",
    color: "#238AAF",
    fontSize: 14,
    letterSpacing: -0.308,
  },
  resultJibun: {
    fontFamily: "Pretendard-Regular",
    fontSize: 12,
    color: "#999999",
    letterSpacing: -0.264,
    lineHeight: 17,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Pretendard-Regular",
    fontSize: 14,
    color: "#BDBDBD",
    letterSpacing: -0.308,
  },
});
