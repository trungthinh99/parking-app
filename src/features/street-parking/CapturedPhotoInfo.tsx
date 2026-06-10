import React from "react";
import { View, StyleSheet, Image, TextInput, TouchableOpacity } from "react-native";
import { Trash } from "iconsax-react-native";
import { Text } from "@/src/components/Text";

export interface CapturedPhotoData {
  uri: string;
  timestamp: string;
  gpsLatitude: number;
  gpsLongitude: number;
}

interface CapturedPhotoInfoProps {
  photo: CapturedPhotoData;
  address: string;
  onAddressChange: (text: string) => void;
  plateNumber: string;
  onPlateNumberChange: (text: string) => void;
  onAddressSearch?: (address: string) => void;
  onPlateRecognize?: () => void;
  isEditing?: boolean;
  /** When true, hide the top border/divider above the image preview */
  hideTopBorder?: boolean;
  /**
   * If provided AND isEditing is true, renders a close icon at the image's top-right
   * corner. The parent owns the queue-then-flush-on-save semantics — this component
   * just fires the callback.
   */
  onDelete?: () => void;
  /** Label for the address action button. Defaults to 검색. */
  addressActionLabel?: string;
}

/**
 * Displays captured photo metadata: image preview, capture time, GPS, address, vehicle plate
 */
export function CapturedPhotoInfo({
  photo,
  address,
  onAddressChange,
  plateNumber,
  onPlateNumberChange,
  onAddressSearch,
  onPlateRecognize,
  isEditing = true,
  hideTopBorder = false,
  onDelete,
  addressActionLabel = "검색",
}: CapturedPhotoInfoProps) {
  // Determine time period label based on hour
  const getTimePeriod = (timestamp: string) => {
    const hour = new Date(timestamp).getHours();
    return hour >= 6 && hour < 18 ? "주간" : "야간";
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <View style={[styles.container, hideTopBorder && styles.containerNoBorder]}>
      {/* Captured image preview, with optional delete button at the top-right corner.
          Tap is queued by the parent and flushed only when the user presses save. */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: photo.uri }} style={styles.imagePreview} resizeMode="cover" />
        {isEditing && onDelete && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Trash size={20} color="#FFFFFF" variant="Bold" />
          </TouchableOpacity>
        )}
      </View>

      {/* Capture time */}
      <View style={styles.infoRow}>
        <Text style={styles.label}>촬영시간</Text>
        <Text style={styles.value}>
          {getTimePeriod(photo.timestamp)} {formatTime(photo.timestamp)}
        </Text>
      </View>

      {/* GPS coordinates */}
      <View style={styles.infoRow}>
        <Text style={styles.label}>GPS</Text>
        <Text style={styles.value}>
          {photo.gpsLatitude}, {photo.gpsLongitude}
        </Text>
      </View>

      {/* Address with search button */}
      <View style={styles.fieldSection}>
        <Text style={styles.fieldLabel}>주소</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.textInput, !isEditing && styles.disabledInput]}
            value={address}
            onChangeText={onAddressChange}
            placeholder="주소를 검색하세요"
            placeholderTextColor="#BDBDBD"
            editable={isEditing}
          />
          {isEditing && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onAddressSearch?.(address)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>{addressActionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Vehicle plate number with recognize button */}
      <View style={styles.fieldSection}>
        <Text style={styles.fieldLabel}>차량번호</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.textInput, !isEditing && styles.disabledInput]}
            value={plateNumber}
            onChangeText={onPlateNumberChange}
            placeholder="차량번호를 입력하세요"
            placeholderTextColor="#BDBDBD"
            editable={isEditing}
          />
          {/* TODO: re-enable plate auto-recognition once the feature is implemented */}
          {/* {isEditing && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onPlateRecognize}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>재인식</Text>
            </TouchableOpacity>
          )} */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E9E9E9",
    gap: 12,
  },
  containerNoBorder: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  imageWrapper: {
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 8,
    backgroundColor: "#F4F4F4",
  },
  deleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 100,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#151515",
    width: 64,
  },
  value: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    flex: 1,
  },
  fieldSection: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#454545",
    marginBottom: 4,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F8F8F8",
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: "400" as const,
    color: "#151515",
  },
  disabledInput: {
    borderColor: "#E9E9E9",
    backgroundColor: "#FFFFFF",
    color: "#151515",
  },
  actionButton: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#238AAF",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
