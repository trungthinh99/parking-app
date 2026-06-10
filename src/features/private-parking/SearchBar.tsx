import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import IconSearchGray from "@/src/assets/images/icons/icon-search-gray.svg";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  /** When provided, the entire search bar becomes tappable (input is disabled) */
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * SearchBar component for address search
 * Matches Figma design with white background and search icon
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = "검색할 주소를 입력하세요",
  onSubmit,
  onPress,
  style,
}: SearchBarProps) {
  // When onPress is provided, render as a tappable surface (no keyboard input)
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <IconSearchGray width={12} height={12} />
        <View style={styles.placeholderContainer}>
          <Text
            style={value ? styles.valueText : styles.placeholderText}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.searchIconContainer} onPress={onSubmit} activeOpacity={0.7}>
        <IconSearchGray width={12} height={12} />
      </TouchableOpacity>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#BDBDBD"
        style={styles.input}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 34,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: "#151515",
    fontFamily: "Pretendard-Regular",
    paddingVertical: 0,
    includeFontPadding: false,
  },
  placeholderContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  valueText: {
    fontSize: 12,
    color: "#151515",
    fontFamily: "Pretendard-Regular",
  },
  placeholderText: {
    fontSize: 12,
    color: "#BDBDBD",
    fontFamily: "Pretendard-Regular",
  },
});
