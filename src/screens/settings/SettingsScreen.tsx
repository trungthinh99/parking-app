import { PATHS } from "@/constants/Paths";
import IconNotification from "@/src/assets/images/icons/icon-notification-24.svg";
import { AuthBackground } from "@/src/features/auth/AuthBackground";
import { BottomNavBar } from "@/src/components/BottomNavBar";
import { CustomSwitch } from "@/src/components/ControllerSwitch";
import { Paper } from "@/src/components/Paper";
import { Text } from "@/src/components/Text";
import { UserAvatar } from "@/src/components/UserAvatar";
import { useRouter } from "expo-router";
import {
  ArchiveBook,
  ArrowRight2,
  Book,
  InfoCircle,
  Lock1,
  LogoutCurve,
  Notification,
  SecuritySafe,
  User,
} from "iconsax-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import {
  useLogoutMutation,
  useMyProfile,
  useWithdrawMutation,
} from "@/src/query/hooks/use-auth-queries";
import type { ApiClientError } from "@/src/api/client";
import { useAppModal } from "@/src/hooks/useAppModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAvatarUrl } from "@/src/lib/avatar-url";
import { useNotificationStore } from "@/src/store/notification-store";
import { requestNotificationPermission, showPermissionDeniedAlert } from "@/src/lib/notification";
import { AlertBottomSheet } from "@/src/components/AlertBottomSheet";
import { PasswordConfirmBottomSheet } from "@/src/components/PasswordConfirmBottomSheet";

/**
 * Settings menu row item type
 */
interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  compact?: boolean;
}

/**
 * Individual row item in the settings menu
 */
function SettingsRow({
  icon,
  label,
  rightElement,
  onPress,
  showDivider = true,
  compact = false,
}: SettingsRowProps) {
  return (
    <Pressable
      style={[styles.row, compact && styles.rowCompact, showDivider && styles.rowDivider]}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {rightElement || <ArrowRight2 size={16} color="#151515" variant="Linear" />}
    </Pressable>
  );
}

/**
 * Settings page with profile info, account management, notifications, and app info
 */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showModal } = useAppModal();
  const notificationEnabled = useNotificationStore((s) => s.isEnabled);
  const setNotificationEnabled = useNotificationStore((s) => s.setEnabled);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const { mutate: logoutMutate } = useLogoutMutation();
  const { mutate: withdrawMutate, isPending: isWithdrawing } = useWithdrawMutation();
  const { data: profile, refetch: refetchProfile } = useMyProfile();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [refetchProfile]);

  const avatarUrl = getAvatarUrl(profile?.avatarPath);
  const displayName = profile?.name || "화주님";
  const displayCode = profile?.surveyorCode ?? profile?.companyCode ?? "";

  const handleToggleNotification = useCallback(
    async (value: boolean) => {
      if (value) {
        // Turning on: request OS permission first
        const granted = await requestNotificationPermission();
        if (!granted) {
          showPermissionDeniedAlert();
          return;
        }
      }
      await setNotificationEnabled(value);
    },
    [setNotificationEnabled]
  );

  const handleLogout = () => {
    showModal({
      title: "로그아웃",
      message: "로그아웃 하시겠습니까?",
      buttons: [
        { text: "취소", style: "cancel" },
        {
          text: "로그아웃",
          style: "destructive",
          onPress: () => {
            logoutMutate();
          },
        },
      ],
    });
  };

  return (
    <AuthBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>환경설정</Text>
          <Pressable style={styles.notificationButton} hitSlop={10}>
            <IconNotification width={26} height={26} color="#FFFFFF" />
            <View style={styles.notificationBadge} />
          </Pressable>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#238AAF"]}
              tintColor="#238AAF"
            />
          }
        >
          {/* Profile section */}
          <View style={styles.profileSection}>
            <UserAvatar uri={avatarUrl} size={100} style={styles.avatarContainer} />
            <Text style={styles.userName}>{displayName}</Text>
            {displayCode ? <Text style={styles.userCode}>{displayCode}</Text> : null}
          </View>

          {/* Card 1: Account management */}
          <Paper style={styles.card}>
            <SettingsRow
              icon={<User size={16} color="#151515" variant="Linear" />}
              label="내 프로필"
              onPress={() => router.push(PATHS.TABS.PROFILE as any)}
            />
            <SettingsRow
              icon={<Lock1 size={16} color="#151515" variant="Linear" />}
              label="보안 설정"
              onPress={() => router.push(PATHS.TABS.SECURITY_SETTINGS as any)}
              showDivider={false}
            />
          </Paper>

          {/* Card 2: Notification toggle */}
          <Paper style={styles.cardSingle}>
            <SettingsRow
              icon={<Notification size={16} color="#151515" variant="Linear" />}
              label="공지"
              showDivider={false}
              rightElement={
                <CustomSwitch
                  value={notificationEnabled}
                  onValueChange={handleToggleNotification}
                />
              }
            />
          </Paper>

          {/* Card 3: App info & legal */}
          <Paper style={styles.card}>
            <SettingsRow
              icon={<ArchiveBook size={16} color="#151515" variant="Linear" />}
              label="앱 버전"
              rightElement={<Text style={styles.versionText}>1.0.0</Text>}
            />
            <SettingsRow
              icon={<InfoCircle size={16} color="#151515" variant="Linear" />}
              label="업데이트 확인"
              onPress={() => {}}
            />
            <SettingsRow
              icon={<SecuritySafe size={16} color="#151515" variant="Linear" />}
              label="개인 정보 보호 정책"
              onPress={() => {}}
            />
            <SettingsRow
              icon={<Book size={16} color="#151515" variant="Linear" />}
              label="이용 약관"
              onPress={() => {}}
              showDivider={false}
            />
          </Paper>

          {/* Logout */}
          <Paper style={styles.cardSingle}>
            <Pressable style={styles.logoutRow} onPress={handleLogout}>
              <Text style={styles.rowLabel}>로그아웃</Text>
              <LogoutCurve
                size={16}
                color="#151515"
                variant="Linear"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </Pressable>
          </Paper>

          {/* Delete account */}
          <Pressable hitSlop={16} onPress={() => setWithdrawVisible(true)}>
            <Text style={styles.deleteAccount}>회원 탈퇴</Text>
          </Pressable>
        </ScrollView>
      </View>
      <BottomNavBar />
      <AlertBottomSheet
        visible={withdrawVisible}
        message="회원 탈퇴를 정말로 하시겠습니까?"
        icon={require("@/src/assets/images/siren.png")}
        onClose={() => setWithdrawVisible(false)}
        buttons={[
          { label: "취소", onPress: () => setWithdrawVisible(false), variant: "secondary" },
          {
            label: "확인",
            onPress: () => {
              setWithdrawVisible(false);
              setPasswordVisible(true);
              setPasswordError("");
            },
            variant: "primary",
          },
        ]}
      />
      <PasswordConfirmBottomSheet
        visible={passwordVisible}
        onClose={() => {
          setPasswordVisible(false);
          setPasswordError("");
        }}
        onConfirm={(password) => {
          setPasswordError("");
          withdrawMutate(
            { password },
            {
              onError: (error: ApiClientError) => {
                if (error.apiError?.code === "CURRENT_PASSWORD_INCORRECT") {
                  setPasswordError("비밀번호가 올바르지 않습니다.");
                } else {
                  setPasswordVisible(false);
                  showModal({
                    title: "오류",
                    message: error.apiError?.message ?? "서버에 문제가 발생했습니다.",
                  });
                }
              },
            }
          );
        }}
        loading={isWithdrawing}
        error={passwordError}
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
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: "relative",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.528,
  },
  notificationButton: {
    position: "absolute",
    right: 16,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3337",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: "center",
  },
  // Profile section
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
    gap: 2,
  },
  avatarContainer: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.308,
  },
  userCode: {
    fontSize: 12,
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: -0.264,
    textAlign: "center",
  },
  // Cards
  card: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 4,
    marginBottom: 12,
  },
  cardSingle: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 0,
    marginBottom: 12,
  },
  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  rowCompact: {
    paddingVertical: 6,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E9E9E9",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
  },
  // Version text
  versionText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.264,
  },
  // Logout row
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  // Delete account
  deleteAccount: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3337",
    letterSpacing: -0.308,
  },
});
