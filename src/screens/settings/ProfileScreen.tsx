import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useAppModal } from "@/src/hooks/useAppModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Text } from "@/src/components/Text";
import { Paper } from "@/src/components/Paper";
import { AuthBackground } from "@/src/features/auth/AuthBackground";
import { AvatarUploadBottomSheet } from "@/src/features/settings/AvatarUploadBottomSheet";
import { UserAvatar } from "@/src/components/UserAvatar";
import { ArrowLeft2, Edit2 } from "iconsax-react-native";
import { PATHS } from "@/constants/Paths";
import { useMyProfile, useUpdateAvatarMutation } from "@/src/query/hooks/use-auth-queries";
import { getAvatarUrl } from "@/src/lib/avatar-url";
import { useAppToast } from "@/src/hooks/useAppToast";

/**
 * Profile info row displaying a label-value pair
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/**
 * My Profile screen showing user information
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showModal } = useAppModal();
  const { showToast } = useAppToast();
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const { data: profile, isLoading } = useMyProfile();
  const { mutate: uploadAvatar, isPending: isUploading } = useUpdateAvatarMutation();

  // Local override for avatar (when user picks a new photo)
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const displayAvatar = localAvatarUri ?? getAvatarUrl(profile?.avatarPath);

  /** Upload picked image to server */
  const handleUpload = useCallback(
    (uri: string) => {
      const fileName = uri.split("/").pop() ?? "avatar.jpg";
      const mimeType = uri.endsWith(".png") ? "image/png" : "image/jpeg";

      // Show local preview immediately
      setLocalAvatarUri(uri);

      uploadAvatar(
        { fileUri: uri, fileName, mimeType },
        {
          onSuccess: () => {
            // Clear local override — server data will be used after refetch
            setLocalAvatarUri(null);
            showToast({ message: "프로필 사진이 변경되었습니다.", type: "success" });
          },
          onError: () => {
            // Revert local preview on failure
            setLocalAvatarUri(null);
            showToast({ message: "오류가 발생했습니다. 나중에 다시 시도해주세요.", type: "error" });
          },
        },
      );
    },
    [uploadAvatar, showModal],
  );

  /** Pick an image from the photo library */
  const handlePickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showModal({
        title: "권한 필요",
        message: "사진 보관함에 접근하려면 권한이 필요합니다.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleUpload(result.assets[0].uri);
    }
  }, [showModal, handleUpload]);

  /** Take a photo with the camera */
  const handleTakePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showModal({
        title: "권한 필요",
        message: "카메라를 사용하려면 권한이 필요합니다.",
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleUpload(result.assets[0].uri);
    }
  }, [showModal, handleUpload]);

  return (
    <AuthBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */} 
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            hitSlop={16}
            onPress={() => router.back()}
          >
            <ArrowLeft2 size={20} color="#FFFFFF" variant="Linear" />
          </Pressable>
          <Text style={styles.headerTitle}>내 프로필</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <UserAvatar uri={displayAvatar} size={100} style={styles.avatarBorder} />
              {isUploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
              <Pressable
                style={styles.editAvatarButton}
                hitSlop={10}
                onPress={() => setShowUploadSheet(true)}
                disabled={isUploading}
              >
                <Edit2 size={14} color="#454545" variant="Linear" />
              </Pressable>
            </View>
          </View>

          {/* Info card */}
          <Paper style={styles.card}>
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.statusDot} />
                <Text style={styles.cardTitle}>주차구획</Text>
              </View>
              <Pressable hitSlop={16} onPress={() => router.push(PATHS.TABS.EDIT_PROFILE as any)}>
                <Edit2 size={16} color="#151515" variant="Linear" />
              </Pressable>
            </View>

            {/* Info rows */}
            {isLoading ? (
              <ActivityIndicator size="small" color="#454545" />
            ) : (
              <View style={styles.infoRows}>
                <InfoRow label="휴대폰 번호" value={profile?.phone ?? "-"} />
                <InfoRow label="생년월일" value={profile?.birthDate ?? "-"} />
                {/* TODO: companyCode temporarily disabled */}
                {/* <InfoRow label="조사업체 코드" value={profile?.companyCode ?? "-"} /> */}
                <InfoRow label="조사원 코드" value={profile?.surveyorCode ?? "-"} />
              </View>
            )}
          </Paper>
        </ScrollView>
      </View>

      {/* Avatar upload bottom sheet */}
      <AvatarUploadBottomSheet
        visible={showUploadSheet}
        onClose={() => setShowUploadSheet(false)}
        onPickFromLibrary={handlePickFromLibrary}
        onTakePhoto={handleTakePhoto}
      />
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.528,
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: "center",
  },
  // Avatar
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F4F4F4",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  // Card
  card: {
    width: "100%",
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3337",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
    letterSpacing: -0.308,
  },
  // Info rows
  infoRows: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#454545",
    letterSpacing: -0.308,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
  },
});
