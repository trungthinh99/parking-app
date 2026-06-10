import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, TextInput, Keyboard } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useAppModal } from "@/src/hooks/useAppModal";
import { useAppToast } from "@/src/hooks/useAppToast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import dayjs from "@/src/lib/dayjs";
import { Text } from "@/src/components/Text";
import { Paper } from "@/src/components/Paper";
import { AuthBackground } from "@/src/features/auth/AuthBackground";
import { Input } from "@/src/components/Input";
import { InlineButton } from "@/src/components/InlineButton";
import { CalendarBottomSheet } from "@/src/components/CalendarBottomSheet";
import { ArrowLeft2 } from "iconsax-react-native";
import IconCalendar from "@/src/assets/images/icons/icon-calendar-16.svg";
import IconTickCircle from "@/src/assets/images/icons/icon-tick-circle-16.svg";
import { UserAvatar } from "@/src/components/UserAvatar";
import { useMyProfile, useUpdateProfileMutation, useCheckPhoneMutation } from "@/src/query/hooks/use-auth-queries";
import { useSendOtpMutation, useVerifyOtpMutation } from "@/src/query/hooks/use-otp-queries";
import { getAvatarUrl } from "@/src/lib/avatar-url";
import { SCREEN_IDS } from "@/src/api-contracts";
import { ApiClientError } from "@/src/api/client";
import type { UserProfileResponse } from "@/src/api-contracts";

const OTP_TIMEOUT_SECONDS = 120;

/** Format phone number with dashes: 010-1234-5678 */
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

/**
 * Edit Profile screen with editable form fields
 */
export default function EditProfileScreen() {
  const { data: profile } = useMyProfile();

  // Wait for profile data before rendering the form
  if (!profile) return null;

  return <EditProfileForm profile={profile} />;
}

/**
 * Inner form component — only mounted once profile data is available,
 * so useState can initialize directly from props.
 */
function EditProfileForm({ profile }: { profile: UserProfileResponse }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showModal } = useAppModal();
  const { showToast } = useAppToast();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfileMutation();
  const checkPhoneMutation = useCheckPhoneMutation();
  const sendOtpMutation = useSendOtpMutation();
  const verifyOtpMutation = useVerifyOtpMutation();

  // Form state initialized directly from profile
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [birthday, setBirthday] = useState(profile.birthDate ?? "");
  // const [companyCode, setCompanyCode] = useState(profile.companyCode ?? ""); // TODO: companyCode temporarily disabled
  // const [region] = useState(""); // TODO: Survey region temporarily hidden

  // Calendar bottom sheet state
  const [calendarVisible, setCalendarVisible] = useState(false);

  // OTP verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [timeLeft, setTimeLeft] = useState(OTP_TIMEOUT_SECONDS);
  const [maskedPhone, setMaskedPhone] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const otpInputRef = useRef<TextInput>(null);

  // Timer countdown
  useEffect(() => {
    if (otpSent && timeLeft > 0 && !otpVerified) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [otpSent, otpVerified]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getErrorMessage = (e: unknown): string => {
    if (e instanceof ApiClientError) {
      return e.apiError?.message ?? e.message;
    }
    return "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
    // Reset OTP state when phone changes
    if (otpSent) {
      if (timerRef.current) clearInterval(timerRef.current);
      setOtpSent(false);
      setOtpCode("");
      setOtpError("");
      setOtpVerified(false);
      setMaskedPhone("");
      setTimeLeft(OTP_TIMEOUT_SECONDS);
    }
  };

  const handleSendOtp = () => {
    const phoneValue = phone.trim();
    if (!phoneValue) {
      showModal({ title: "프로필 수정", message: "휴대폰 번호를 입력해주세요." });
      return;
    }

    // First check if phone is available (belongs to current user or unused)
    checkPhoneMutation.mutate(
      { phone: phoneValue },
      {
        onSuccess: (checkRes) => {
          if (!checkRes.available) {
            showToast({ message: "이 휴대폰 번호는 이미 사용 중입니다.", type: "error" });
            return;
          }
          // Phone is available — proceed to send OTP
          sendOtpMutation.mutate(
            { body: { context: "signup", destination: phoneValue }, screenId: SCREEN_IDS.APP_MY_PROFILE },
            {
              onSuccess: (res) => {
                if (res.sent) {
                  setMaskedPhone(res.otpDestinationMasked);
                  setOtpSent(true);
                  setTimeLeft(OTP_TIMEOUT_SECONDS);
                  setOtpCode("");
                  setOtpError("");
                  setTimeout(() => otpInputRef.current?.focus(), 100);
                } else {
                  showModal({
                    title: "프로필 수정",
                    message: res.message ?? "인증번호 전송에 실패했습니다.",
                  });
                }
              },
              onError: (e) => {
                showModal({ title: "프로필 수정", message: getErrorMessage(e) });
              },
            },
          );
        },
        onError: (e) => {
          showModal({ title: "프로필 수정", message: getErrorMessage(e) });
        },
      },
    );
  };

  const handleResendOtp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setOtpVerified(false);
    setTimeLeft(OTP_TIMEOUT_SECONDS);
    setOtpCode("");
    setOtpError("");
    handleSendOtp();
  };

  const handleVerifyOtp = () => {
    if (otpCode.length !== 6) return;

    verifyOtpMutation.mutate(
      {
        body: { context: "signup", destination: phone.trim(), otp: otpCode },
        screenId: SCREEN_IDS.APP_MY_PROFILE,
      },
      {
        onSuccess: (res) => {
          if (res.verified) {
            if (timerRef.current) clearInterval(timerRef.current);
            setOtpVerified(true);
            setOtpError("");
          } else {
            setOtpError("잘못된 인증코드입니다. 다시 시도하세요.");
          }
        },
        onError: (e) => {
          setOtpError(getErrorMessage(e));
        },
      },
    );
  };

  const isOtpValid = otpCode.length === 6;
  const isTimerExpired = timeLeft === 0;
  // Phone was changed and OTP flow was initiated
  const phoneChanged = phone !== profile.phone;
  // Save is blocked if OTP was sent but not yet verified
  const isSaveBlocked = otpSent && !otpVerified;

  const handleSave = () => {
    if (isSaveBlocked) {
      showModal({ title: "프로필 수정", message: "휴대폰 인증을 완료해주세요." });
      return;
    }

    // Reject users under 18 years old (counted back from today)
    const birth = dayjs(birthday.trim(), "YYYY.MM.DD");
    if (birth.isValid() && dayjs().diff(birth, "year") < 18) {
      showModal({ title: "프로필 수정", message: "만 18세 미만은 조사원으로 가입할 수 없습니다!" });
      return;
    }

    const updates: { phone?: string; birthDate?: string } = {};

    if (phoneChanged) updates.phone = phone;
    if (birthday !== profile.birthDate) updates.birthDate = birthday;

    // Nothing changed
    if (Object.keys(updates).length === 0) {
      router.back();
      return;
    }

    updateProfile(updates, {
      onSuccess: () => {
        showToast({ message: "프로필 정보가 수정되었습니다.", type: "success" });
        router.back();
      },
      onError: () => {
        showToast({ message: "정보 수정 중 오류가 발생했습니다. 다시 시도해주세요.", type: "error" });
      },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AuthBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => router.back()}
          >
            <ArrowLeft2 size={20} color="#FFFFFF" variant="Linear" />
          </Pressable>
          <Text style={styles.headerTitle}>내 프로필</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bottomOffset={40}
          extraKeyboardSpace={20}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <UserAvatar
              uri={getAvatarUrl(profile.avatarPath)}
              size={100}
              style={styles.avatarContainer}
            />
          </View>

          {/* Form card */}
          <Paper style={styles.card}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={styles.statusDot} />
              <Text style={styles.sectionTitle}>주차구획</Text>
            </View>

            {/* Form fields */}
            <View style={styles.fields}>
              {/* Phone number */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>휴대폰 번호</Text>
                <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}>
                    <Input
                      value={phone}
                      onChangeText={handlePhoneChange}
                      placeholder="휴대폰 번호를 입력해주세요"
                      keyboardType="phone-pad"
                      maxLength={13}
                      editable={!otpSent}
                    />
                  </View>
                  <InlineButton
                    title={checkPhoneMutation.isPending || sendOtpMutation.isPending ? "전송중..." : "중복확인"}
                    onPress={handleSendOtp}
                    disabled={checkPhoneMutation.isPending || sendOtpMutation.isPending || otpSent}
                    style={{ paddingHorizontal: 14 }}
                  />
                </View>
              </View>

              {/* OTP Verification Section */}
              {otpSent && (
                <View style={styles.otpSection}>
                  {/* OTP Section Header */}
                  <View style={{ gap: 4 }}>
                    <Text style={styles.fieldLabel}>인증 코드 검증</Text>
                    <Text style={{ fontSize: 12, color: "#454545" }}>
                      {maskedPhone}으로 인증코드를 전송했습니다.
                    </Text>
                  </View>

                  {/* 6-digit OTP Input */}
                  <View style={{ gap: 4 }}>
                    <Text style={styles.fieldLabel}>6자리 인증코드</Text>
                    <View style={styles.inputRow}>
                      <View
                        style={[
                          styles.otpInputContainer,
                          otpError ? styles.otpInputError : undefined,
                        ]}
                      >
                        <TextInput
                          ref={otpInputRef}
                          value={otpCode}
                          onChangeText={(text) => {
                            setOtpCode(text.replace(/\D/g, "").slice(0, 6));
                            if (otpError) setOtpError("");
                          }}
                          placeholder="전송된 인증코드를 입력하세요"
                          placeholderTextColor="#BDBDBD"
                          keyboardType="number-pad"
                          maxLength={6}
                          editable={!isTimerExpired && !otpVerified}
                          style={styles.otpTextInput}
                        />
                        {otpVerified ? (
                          <IconTickCircle width={16} height={16} style={{ marginLeft: 8 }} />
                        ) : (
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              marginLeft: 8,
                            }}
                          >
                            {formatTime(timeLeft)}
                          </Text>
                        )}
                      </View>
                      <Pressable
                        onPress={handleVerifyOtp}
                        disabled={
                          !isOtpValid ||
                          verifyOtpMutation.isPending ||
                          isTimerExpired ||
                          otpVerified
                        }
                        style={{
                          backgroundColor:
                            isOtpValid && !isTimerExpired && !otpVerified ? "#238AAF" : "#E9E9E9",
                          borderRadius: 8,
                          paddingHorizontal: 14,
                          height: 32,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color:
                              isOtpValid && !isTimerExpired && !otpVerified ? "#FFFFFF" : "#8D8D8D",
                          }}
                        >
                          {verifyOtpMutation.isPending ? "확인중..." : "확인"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* OTP Status Message */}
                  {otpError ? (
                    <Text style={{ fontSize: 12, color: "#E53935" }}>{otpError}</Text>
                  ) : (
                    !otpVerified && (
                      <Text style={{ fontSize: 12, color: "#10A671" }}>
                        인증코드가 전송되었습니다. 2분 이내에 만료됩니다.
                      </Text>
                    )
                  )}

                  {/* Resend Link */}
                  {!otpVerified && (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 12, color: "#454545" }}>
                        코드를 받지 못하셨나요?
                      </Text>
                      <Pressable onPress={handleResendOtp} disabled={checkPhoneMutation.isPending || sendOtpMutation.isPending}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: isTimerExpired ? "#238AAF" : "#8D8D8D",
                          }}
                        >
                          재전송
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* Date of birth */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>생년월일</Text>
                <Input
                  value={birthday}
                  onChangeText={() => {}}
                  placeholder="생년월일을 선택하세요"
                  editable={false}
                  onPress={() => {
                    Keyboard.dismiss();
                    setCalendarVisible(true);
                  }}
                  right={<IconCalendar width={16} height={16} />}
                />
                <CalendarBottomSheet
                  visible={calendarVisible}
                  selectedDate={birthday ? dayjs(birthday, "YYYY.MM.DD") : null}
                  onClose={() => setCalendarVisible(false)}
                  onConfirm={(date) => {
                    // Reject users under 18 years old (counted back from today)
                    if (dayjs().diff(date, "year") < 18) {
                      showModal({
                        title: "프로필 수정",
                        message: "만 18세 미만은 조사원으로 가입할 수 없습니다!",
                      });
                      return;
                    }
                    setBirthday(date.format("YYYY.MM.DD"));
                  }}
                />
              </View>

              {/* TODO: Survey company code temporarily disabled
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>조사업체 코드</Text>
                <View style={styles.inputRow}>
                  <View style={{ flex: 1 }}>
                    <Input
                      value={companyCode}
                      onChangeText={setCompanyCode}
                      placeholder="조사업체 코드"
                    />
                  </View>
                  <InlineButton title="조회" onPress={() => {}} style={{ paddingHorizontal: 14 }} />
                </View>
              </View>
              */}

              {/* TODO: Survey area temporarily hidden - not part of profile API
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>조사 지역</Text>
                <Input
                  value={region}
                  onChangeText={() => {}}
                  placeholder="조사 지역"
                  editable={false}
                  right={<ArrowDown2 size={16} color="#151515" variant="Linear" />}
                />
              </View>
              */}
            </View>

            {/* Action buttons */}
            <View style={styles.buttonRow}>
              <InlineButton
                title="취소"
                onPress={handleCancel}
                variant="secondary"
                style={styles.actionButton}
              />
              <InlineButton
                title={isSaving ? "저장중..." : "저장"}
                onPress={handleSave}
                disabled={isSaving}
                variant="primary"
                style={styles.actionButton}
              />
            </View>
          </Paper>
        </KeyboardAwareScrollView>
      </View>
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
  avatarContainer: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  // Card
  card: {
    width: "100%",
    borderRadius: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3337",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
    letterSpacing: -0.308,
  },
  // Fields
  fields: {
    gap: 16,
    marginBottom: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#454545",
    letterSpacing: -0.308,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  // OTP section
  otpSection: {
    gap: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E9E9E9",
    paddingVertical: 16,
  },
  otpInputContainer: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#F4F4F4",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 32,
  },
  otpInputError: {
    borderWidth: 1,
    borderColor: "#E53935",
  },
  otpTextInput: {
    flex: 1,
    fontSize: 14,
    color: "#151515",
    paddingVertical: 0,
    includeFontPadding: false,
    fontFamily: "Pretendard-Regular",
  },
  // Buttons
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
