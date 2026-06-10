import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch, ActivityIndicator, RefreshControl } from "react-native";
import { useForm } from "react-hook-form";
import { useAppModal } from "@/src/hooks/useAppModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLogoutMutation, useChangePasswordMutation, useMyProfile, useDeviceSessions, useRevokeDeviceSessionMutation } from "@/src/query/hooks/use-auth-queries";
import { reportDeviceLocation } from "@/src/lib/report-device-location";
import { AUTH_VALIDATION } from "@/src/api-contracts/auth-validation";
import type { ApiClientError } from "@/src/api/client";
import type { DeviceSessionItem } from "@/src/api-contracts";
import { Text } from "@/src/components/Text";
import { Paper } from "@/src/components/Paper";
import { ControllerPasswordInput } from "@/src/components/ControllerPasswordInput";
import { InlineButton } from "@/src/components/InlineButton";
import { AuthBackground } from "@/src/features/auth/AuthBackground";
import { ArrowLeft2, Edit2, ShieldTick, LogoutCurve } from "iconsax-react-native";

type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * Security settings screen with password change, 2FA, and device management
 */
export default function SecuritySettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showModal } = useAppModal();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const { data: profile } = useMyProfile();
  const maskedPassword = profile?.passwordHint ?? "••••••••";

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
    getValues,
  } = useForm<ChangePasswordFormValues>({
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useChangePasswordMutation();

  const handleCancelPasswordEdit = () => {
    setIsEditingPassword(false);
    reset();
  };

  const onSubmit = handleSubmit((values) => {
    changePasswordMutation.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          handleCancelPasswordEdit();
          showModal({
            title: "비밀번호 변경",
            message: "비밀번호가 성공적으로 변경되었습니다.",
          });
        },
        onError: (error: ApiClientError) => {
          const message =
            error.apiError?.message ??
            error.message ??
            "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
          showModal({ title: "비밀번호 변경", message });
        },
      }
    );
  });

  const { mutate: logoutMutate } = useLogoutMutation();
  const { data: deviceData, isLoading: isLoadingDevices, refetch: refetchDevices } = useDeviceSessions();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchDevices();
    setRefreshing(false);
  };
  const revokeDeviceMutation = useRevokeDeviceSessionMutation();

  // Report current device location to server on mount (fire-and-forget)
  useEffect(() => {
    reportDeviceLocation();
  }, []);

  const handleRevokeDevice = (device: DeviceSessionItem) => {
    showModal({
      title: "기기 로그아웃",
      message: device.isCurrent
        ? "현재 기기에서 로그아웃 하시겠습니까?"
        : `'${device.deviceName ?? "알 수 없는 기기"}'에서 로그아웃 하시겠습니까?`,
      buttons: [
        { text: "취소", style: "cancel" },
        {
          text: "로그아웃",
          style: "destructive",
          onPress: () => {
            if (device.isCurrent) {
              logoutMutate();
            } else {
              revokeDeviceMutation.mutate({ sessionId: device.id });
            }
          },
        },
      ],
    });
  };

  /** Format lastUsedAt ISO string to a readable Korean string */
  const formatLastUsed = (isoString: string | null): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    if (isToday) return `오늘 ${hours}:${minutes}`;
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const devices = deviceData?.devices ?? [];

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
          <Text style={styles.headerTitle}>보안 설정</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFFFFF"
              colors={["#238AAF"]}
            />
          }
        >
          {/* Card 1: Password change */}
          <Paper style={isEditingPassword ? { ...styles.card, gap: 16 } : styles.card}>
            {!isEditingPassword ? (
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.statusDot} />
                    <Text style={styles.cardTitle}>비밀번호 변경</Text>
                  </View>
                  <Pressable hitSlop={10} onPress={() => setIsEditingPassword(true)}>
                    <Edit2 size={16} color="#292D32" variant="Linear" />
                  </Pressable>
                </View>
                <View style={styles.passwordRow}>
                  <Text style={styles.passwordLabel}>현재 비밀번호</Text>
                  <Text style={styles.passwordValue}>{maskedPassword}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.statusDot} />
                  <Text style={styles.cardTitle}>비밀번호 변경</Text>
                </View>
                <ControllerPasswordInput
                  control={control}
                  name="currentPassword"
                  placeholder="현재 비밀번호 입력"
                  label="현재 비밀번호"
                  required
                  rules={{
                    required: "현재 비밀번호를 입력하세요.",
                  }}
                />
                <View style={{ rowGap: 4 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      columnGap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#151515" }}>
                      새 비밀번호
                      <Text style={{ color: "#FF3337" }}> *</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: "#8D8D8D" }}>
                      {AUTH_VALIDATION.password.message}
                    </Text>
                  </View>
                  <ControllerPasswordInput
                    control={control}
                    name="newPassword"
                    placeholder="새 비밀번호 입력"
                    rules={{
                      required: "새 비밀번호를 입력하세요.",
                      pattern: {
                        value: AUTH_VALIDATION.password.pattern,
                        message: AUTH_VALIDATION.password.message,
                      },
                    }}
                  />
                </View>
                <ControllerPasswordInput
                  control={control}
                  name="confirmPassword"
                  placeholder="비밀번호를 다시 입력하세요"
                  label="새 비밀번호 확인"
                  required
                  rules={{
                    required: "비밀번호를 다시 입력하세요.",
                    validate: (value) =>
                      value === getValues("newPassword") || "비밀번호가 일치하지 않습니다.",
                  }}
                />
                <View style={styles.buttonRow}>
                  <InlineButton
                    title="취소"
                    variant="secondary"
                    onPress={handleCancelPasswordEdit}
                    disabled={changePasswordMutation.isPending}
                    style={styles.actionButton}
                  />
                  <InlineButton
                    title="저장"
                    variant="primary"
                    onPress={onSubmit}
                    disabled={!isValid}
                    loading={changePasswordMutation.isPending}
                    style={styles.actionButton}
                  />
                </View>
              </>
            )}
          </Paper>

          {/* Card 2: Two-factor authentication */}
          <Paper style={styles.card}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.statusDot} />
              <Text style={styles.cardTitle}>이중 인증</Text>
            </View>
            <View style={styles.twoFactorRow}>
              <View style={styles.twoFactorLeft}>
                <ShieldTick size={16} color="#151515" variant="Linear" />
                <Text style={styles.twoFactorLabel}>이중 인증 활성화</Text>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={setTwoFactorEnabled}
                trackColor={{ false: "#E9E9E9", true: "#238AAF" }}
                thumbColor="#FFFFFF"
                style={styles.toggle}
              />
            </View>
          </Paper>

          {/* Card 3: Device login management */}
          <Paper style={styles.card}>
            <View style={styles.deviceHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.statusDot} />
                <Text style={styles.cardTitle}>기기 로그인 관리</Text>
              </View>
              <Text style={styles.deviceDescription}>
                현재 로그인된 모든 기기를 확인하고 관리합니다.
              </Text>
            </View>
            {isLoadingDevices ? (
              <ActivityIndicator size="small" color="#238AAF" />
            ) : devices.length === 0 ? (
              <Text style={styles.deviceMeta}>로그인된 기기가 없습니다.</Text>
            ) : (
              devices.map((device, index) => (
                <View
                  key={device.id}
                  style={[
                    styles.deviceRow,
                    index < devices.length - 1 && styles.deviceRowDivider,
                  ]}
                >
                  <View style={styles.deviceInfo}>
                    <View style={styles.deviceNameRow}>
                      <Text style={styles.deviceName}>
                        {device.deviceName ?? "알 수 없는 기기"}
                      </Text>
                      {device.isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>현재 기기</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.deviceMeta}>
                      {device.lastLocationAddress ?? "위치 없음"}
                      {device.lastUsedAt ? ` · ${formatLastUsed(device.lastUsedAt)}` : ""}
                    </Text>
                  </View>
                  <Pressable
                    hitSlop={10}
                    onPress={() => handleRevokeDevice(device)}
                  >
                    <LogoutCurve
                      style={styles.logoutIcon}
                      size={16}
                      color="#151515"
                      variant="Linear"
                    />
                  </Pressable>
                </View>
              ))
            )}
          </Paper>
        </ScrollView>
      </View>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
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
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  // Card shared
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
  // Card 1: Password
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#454545",
    letterSpacing: -0.308,
  },
  passwordValue: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
  },
  // Card 1: Password edit buttons
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  // Card 2: Two-factor
  twoFactorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: -10,
  },
  twoFactorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  twoFactorLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
  },
  toggle: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  // Card 3: Device management
  deviceHeader: {
    gap: 8,
    marginBottom: 16,
  },
  deviceDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#454545",
    letterSpacing: -0.308,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  deviceRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E9E9E9",
  },
  deviceInfo: {
    flex: 1,
    gap: 4,
  },
  deviceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#151515",
    letterSpacing: -0.308,
  },
  currentBadge: {
    backgroundColor: "#238AAF",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  deviceMeta: {
    fontSize: 12,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.264,
    lineHeight: 16.8,
  },
  logoutIcon: {
    transform: [{ rotate: "180deg" }],
  },
});
