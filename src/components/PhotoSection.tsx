import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, CloseCircle } from "iconsax-react-native";

import { Text } from "@/src/components/Text";
import { useAppModal } from "@/src/hooks/useAppModal";
import { getServerOrigin } from "@/src/api/client";
import type { ParkingLotPhotoDto } from "@/src/api-contracts";
import { PhotoLightbox } from "./PhotoLightbox";
import { RequiredDot } from "./RequiredDot";

/** A pending photo selected from camera/library, not yet uploaded */
export type PendingPhoto = {
  /** Stable client-side id */
  localId: string;
  uri: string;
  fileName: string;
  mimeType: string;
};

interface PhotoSectionProps {
  uploadedPhotos: ParkingLotPhotoDto[];
  pendingPhotos: PendingPhoto[];
  /** IDs of uploaded photos queued for deletion — hidden from the grid until save flushes them */
  pendingDeletionIds: Set<number>;
  onAddPending: (photo: PendingPhoto) => void;
  onRemovePending: (localId: string) => void;
  /** Queue an uploaded photo for deletion (no server call until save) */
  onMarkUploadedForDeletion?: (photoId: number) => void;
  isEditing: boolean;
}

const COLUMNS = 4;
const GRID_GAP = 8;

/** Resolve a photo's display URL — backend serves /uploads/* statically */
function resolvePhotoUrl(filePath: string): string {
  // filePath is stored as "parking-lot-photos/<uuid>.<ext>" (relative under /uploads)
  const path = filePath.startsWith("/") ? filePath : `/uploads/${filePath}`;
  return `${getServerOrigin()}${path}`;
}

/** Derive a safe file name + mime type from a picker asset */
function deriveAssetMeta(asset: ImagePicker.ImagePickerAsset): {
  fileName: string;
  mimeType: string;
} {
  const fallbackExt = "jpg";
  const uri = asset.uri;
  const guessedExt = uri.split(".").pop()?.toLowerCase() ?? fallbackExt;
  const ext = ["jpg", "jpeg", "png", "webp"].includes(guessedExt)
    ? guessedExt
    : fallbackExt;
  const mime =
    asset.mimeType ??
    (ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : "image/jpeg");
  const name = asset.fileName ?? `photo_${Date.now()}.${ext}`;
  return { fileName: name, mimeType: mime };
}

/**
 * Photo upload section in the basic info tab.
 * Lets the surveyor capture a new photo or pick one from the library,
 * shows already-uploaded photos and pending (not-yet-uploaded) ones,
 * and reports newly selected photos to the parent via onAddPending.
 *
 * Adds + deletes are queued locally and applied on save by the parent.
 */
export function PhotoSection({
  uploadedPhotos,
  pendingPhotos,
  pendingDeletionIds,
  onAddPending,
  onRemovePending,
  onMarkUploadedForDeletion,
  isEditing,
}: PhotoSectionProps) {
  const { showModal } = useAppModal();

  // Index of the currently zoomed photo, or null when the lightbox is closed
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Measure the photo grid container so thumbnails can size to fit 4 per row exactly
  const [gridWidth, setGridWidth] = useState(0);
  const thumbSize = gridWidth > 0 ? (gridWidth - GRID_GAP * (COLUMNS - 1)) / COLUMNS : 0;

  // Combined list rendered as thumbnails (uploaded first, then pending).
  // Photos queued for deletion are filtered out so they disappear immediately on tap,
  // while the actual server-side delete is deferred to the save flow.
  const allPhotos = useMemo(() => {
    const uploaded = uploadedPhotos
      .filter((p) => !pendingDeletionIds.has(p.id))
      .map((p) => ({
        key: `u_${p.id}`,
        uri: resolvePhotoUrl(p.filePath),
        kind: "uploaded" as const,
        photoId: p.id,
      }));
    const pending = pendingPhotos.map((p) => ({
      key: `p_${p.localId}`,
      uri: p.uri,
      kind: "pending" as const,
      localId: p.localId,
    }));
    return [...uploaded, ...pending];
  }, [uploadedPhotos, pendingPhotos, pendingDeletionIds]);

  // Open the OS settings page when the user has previously denied permission
  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  const handlePickFromCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showModal({
        title: "권한 필요",
        message: "카메라 사용 권한이 필요합니다. 설정에서 권한을 허용해주세요.",
        buttons: [
          { text: "취소", style: "cancel" },
          { text: "설정 열기", onPress: openSettings },
        ],
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      exif: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const meta = deriveAssetMeta(asset);
    onAddPending({
      localId: `c_${Date.now()}`,
      uri: asset.uri,
      fileName: meta.fileName,
      mimeType: meta.mimeType,
    });
  }, [onAddPending, showModal, openSettings]);

  const handlePickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showModal({
        title: "권한 필요",
        message: "사진첩 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.",
        buttons: [
          { text: "취소", style: "cancel" },
          { text: "설정 열기", onPress: openSettings },
        ],
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      exif: false,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const meta = deriveAssetMeta(asset);
    onAddPending({
      localId: `l_${Date.now()}`,
      uri: asset.uri,
      fileName: meta.fileName,
      mimeType: meta.mimeType,
    });
  }, [onAddPending, showModal, openSettings]);

  // Use the global app modal so the chooser looks identical on iOS and Android
  // (the native Alert.alert action sheet on Android looks rough by comparison).
  const handleCameraButtonPress = useCallback(() => {
    showModal({
      title: "주차장 사진",
      message: "사진을 추가하는 방법을 선택해주세요.",
      buttons: [
        { text: "취소", style: "cancel" },
        { text: "사진첩", onPress: handlePickFromLibrary },
        { text: "촬영", onPress: handlePickFromCamera },
      ],
    });
  }, [handlePickFromCamera, handlePickFromLibrary, showModal]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <RequiredDot />
        <Text style={styles.sectionLabelRequired}>사진</Text>
      </View>

      {/* Caption above the camera button */}
      <Text style={styles.caption}>주차장 사진</Text>

      {/* 4-column grid: thumbnail size scales with container width so cells always fill the row.
          We use marginRight on items in columns 0..2 (skipping the last column) for an even gap. */}
      <View
        style={styles.photoRow}
        onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
      >
        {gridWidth > 0 && (
          <>
            {/* Camera trigger button — occupies the first cell when in editing mode */}
            {isEditing && (
              <TouchableOpacity
                style={[
                  styles.cameraButton,
                  {
                    width: thumbSize,
                    height: thumbSize,
                    marginRight: GRID_GAP,
                    marginBottom: GRID_GAP,
                  },
                ]}
                onPress={handleCameraButtonPress}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Camera size={28} color="#454545" variant="Linear" />
              </TouchableOpacity>
            )}

            {/* Thumbnails (uploaded + pending) — tap to open the fullscreen lightbox.
                Cell index in the grid = (camera button takes slot 0 when editing) + idx. */}
            {allPhotos.map((photo, idx) => {
              const cellIndex = (isEditing ? 1 : 0) + idx;
              const isLastInRow = cellIndex % COLUMNS === COLUMNS - 1;
              return (
                <View
                  key={photo.key}
                  style={[
                    styles.thumbWrapper,
                    {
                      width: thumbSize,
                      height: thumbSize,
                      marginRight: isLastInRow ? 0 : GRID_GAP,
                      marginBottom: GRID_GAP,
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setLightboxIndex(idx)}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={[styles.thumb, { width: thumbSize, height: thumbSize }]}
                    />
                  </TouchableOpacity>
                  {/* Remove button visible while editing.
                      Tap is queued locally; actual server delete happens on save. */}
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() =>
                        photo.kind === "pending"
                          ? onRemovePending(photo.localId)
                          : onMarkUploadedForDeletion?.(photo.photoId)
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <CloseCircle size={18} color="#FF3337" variant="Bold" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}
      </View>

      {/* Fullscreen photo viewer with horizontal swipe between photos */}
      <PhotoLightbox
        visible={lightboxIndex !== null}
        uris={allPhotos.map((p) => p.uri)}
        initialIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  sectionLabelRequired: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
  },
  caption: {
    fontSize: 13,
    fontWeight: "500",
    color: "#454545",
    marginBottom: 8,
  },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    // Negative bottom margin compensates for the per-row marginBottom on the last row
    marginBottom: -GRID_GAP,
  },
  cameraButton: {
    borderRadius: 8,
    backgroundColor: "#F4F4F4",
    borderWidth: 1,
    borderColor: "#E9E9E9",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbWrapper: {
    borderRadius: 8,
    overflow: "visible",
    position: "relative",
  },
  thumb: {
    borderRadius: 8,
    backgroundColor: "#E9E9E9",
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
  },
});
