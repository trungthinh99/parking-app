import { PATHS } from "@/constants/Paths";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useForm } from "react-hook-form";
import { useAppModal } from "@/src/hooks/useAppModal";

import { sendOtp, verifyOtp, appFindPassword } from "@/src/api/auth";
import { ApiClientError } from "@/src/api/client";
import { SCREEN_IDS } from "@/src/api-contracts";
import IconInfoCircle from "@/src/assets/images/icons/icon-info-circle-20.svg";
import IconTickCircle from "@/src/assets/images/icons/icon-tick-circle-16.svg";
import { AuthBackground } from "@/src/features/auth/AuthBackground";
import { ControllerInput } from "@/src/components/ControllerInput";
import { InlineButton } from "@/src/components/InlineButton";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { Text } from "@/src/components/Text";
import { formatPhoneNumber } from "@/src/lib/format-phone";

const OTP_TIMEOUT_SECONDS = 120; // 2 minutes

type FindPasswordFormValues = {
  phone: string;
};

export default function FindPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showModal } = useAppModal();

  const {
    control,
    getValues,
    formState: { isValid },
  } = useForm<FindPasswordFormValues>({
    mode: "onChange",
    defaultValues: { phone: "" },
  });

  // OTP local state (not form-controlled)
  const [otpCode, setOtpCode] = useState("");

  // UI states
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_TIMEOUT_SECONDS);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [phoneFieldError, setPhoneFieldError] = useState<string | undefined>();
  const [timerKey, setTimerKey] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const otpInputRef = useRef<TextInput>(null);

  // Timer countdown
  useEffect(() => {
    if (otpSent && timeLeft > 0) {
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
  }, [otpSent, timerKey]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const maskPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length >= 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
    return phone;
  };

  const handleSendOtp = async () => {
    Keyboard.dismiss();

    const { phone } = getValues();
    if (!phone.trim()) return;

    setSendingOtp(true);
    try {
      const res = await sendOtp(
        { context: "reset_password", destination: phone.trim() },
        SCREEN_IDS.APP_AUTH_FIND_PASSWORD
      );
      setMaskedPhone(res.otpDestinationMasked ?? maskPhoneNumber(phone.trim()));
      setOtpSent(true);
      setTimeLeft(OTP_TIMEOUT_SECONDS);
      setOtpCode("");
      setOtpError("");

      // Focus OTP input after a short delay
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    } catch (e) {
      const message =
        e instanceof ApiClientError
          ? e.message
          : "인증코드 전송에 실패했습니다. 잠시 후 다시 시도해주세요.";
      setOtpError(message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setOtpVerified(false);
    setVerificationToken("");
    setTimeLeft(OTP_TIMEOUT_SECONDS);
    setTimerKey((prev) => prev + 1);
    await handleSendOtp();
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;

    setVerifyingOtp(true);
    setOtpError("");
    try {
      const { phone } = getValues();
      const res = await verifyOtp(
        { context: "reset_password", destination: phone.trim(), otp: otpCode },
        SCREEN_IDS.APP_AUTH_FIND_PASSWORD
      );
      if (res.verified && res.verificationToken) {
        if (timerRef.current) clearInterval(timerRef.current);
        setOtpVerified(true);
        setVerificationToken(res.verificationToken);
      } else {
        setOtpError("잘못된 인증코드입니다. 다시 시도하세요.");
      }
    } catch (e) {
      const message =
        e instanceof ApiClientError ? e.message : "잘못된 인증코드입니다. 다시 시도하세요";
      setOtpError(message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleContinue = async () => {
    if (!otpSent) {
      handleSendOtp();
    } else if (otpVerified) {
      const { phone } = getValues();
      setVerifyingOtp(true);
      try {
        await appFindPassword({
          phone: phone.trim(),
          verificationToken,
        });
        router.replace({
          pathname: PATHS.AUTH.FIND_PASSWORD_SUCCESS,
          params: {
            phone: phone.trim(),
            verificationToken,
          },
        });
      } catch (e) {
        if (e instanceof ApiClientError && e.status === 404) {
          router.push(PATHS.AUTH.FIND_ERROR);
        } else {
          const message = e instanceof ApiClientError ? e.message : "사용자를 찾을 수 없습니다.";
          showModal({ title: "오류", message });
        }
      } finally {
        setVerifyingOtp(false);
      }
    } else {
      handleVerifyOtp();
    }
  };

  const isOtpValid = otpCode.length === 6;
  const isTimerExpired = timeLeft === 0;

  return (
    <AuthBackground>
      <View style={{ flex: 1 }}>
        {/* Scrollable content with keyboard awareness */}
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: insets.top + 32,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bottomOffset={40}
        >
          {/* AuthCard content inline */}
          <View
            style={{
              borderRadius: 28,
              backgroundColor: "#FFFFFF",
              shadowColor: "#000000",
              shadowOpacity: 0.12,
              shadowRadius: 7,
              shadowOffset: { width: 1, height: 2 },
              padding: 16,
            }}
          >
            <View style={{ rowGap: 16 }}>
              {/* Title */}
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 24,
                  fontWeight: "600",
                  color: "#151515",
                  lineHeight: 34,
                }}
              >
                비밀번호 찾기
              </Text>

              <View style={{ rowGap: 20 }}>
                {/* Info Section */}
                <View style={{ rowGap: 4 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      columnGap: 4,
                    }}
                  >
                    <IconInfoCircle width={20} height={20} color="#151515" />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#151515",
                      }}
                    >
                      비밀번호 변경
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: "#454545", lineHeight: 17 }}>
                    비밀번호를 변경하려면 등록된 휴대폰 번호를 입력해 주세요.
                  </Text>
                </View>

                {/* Phone Input with Send OTP Button */}
                <View style={{ rowGap: 4 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      columnGap: 4,
                      alignItems: "flex-end",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <ControllerInput
                        control={control}
                        name="phone"
                        label="휴대폰 번호"
                        placeholder="휴대폰 번호를 입력해주세요"
                        keyboardType="phone-pad"
                        maxLength={13}
                        required
                        editable={!otpSent}
                        hideError
                        onErrorChange={setPhoneFieldError}
                        formatValue={formatPhoneNumber}
                        rules={{
                          required: "필수 항목이 입력되지 않았습니다.",
                          pattern: {
                            value: /^01[0-9]-\d{3,4}-\d{4}$/,
                            message: "전화번호 형식이 올바르지 않습니다.",
                          },
                        }}
                      />
                    </View>
                    <InlineButton
                      title={sendingOtp ? "전송중..." : "인증코드 전송"}
                      onPress={handleSendOtp}
                      disabled={!isValid || sendingOtp || otpSent}
                    />
                  </View>
                  {phoneFieldError && !otpSent && (
                    <Text style={{ fontSize: 12, color: "#FF3337" }}>{phoneFieldError}</Text>
                  )}
                </View>

                {/* OTP Verification Section - Only show after OTP sent */}
                {otpSent && (
                  <View style={{ rowGap: 12 }}>
                    {/* Divider */}
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "#E5E5E5",
                        marginVertical: 4,
                      }}
                    />

                    {/* OTP Section Header */}
                    <View style={{ rowGap: 4 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#151515",
                        }}
                      >
                        인증 코드 검증
                      </Text>
                      <Text style={{ fontSize: 12, color: "#454545" }}>
                        {maskedPhone}으로 인증코드를 전송했습니다.
                      </Text>
                    </View>

                    {/* 6-digit OTP Input */}
                    <View style={{ rowGap: 8 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#151515",
                        }}
                      >
                        6자리 인증코드
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#F8F8F8",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            height: 32,
                            borderWidth: otpError ? 1 : 0,
                            borderColor: otpError ? "#E53935" : "transparent",
                          }}
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
                            style={{
                              flex: 1,
                              fontSize: 14,
                              color: "#151515",
                              paddingVertical: 0,
                              includeFontPadding: false,
                            }}
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
                          disabled={!isOtpValid || verifyingOtp || isTimerExpired || otpVerified}
                          style={{
                            backgroundColor:
                              isOtpValid && !isTimerExpired && !otpVerified ? "#238AAF" : "#E5E5E5",
                            borderRadius: 8,
                            paddingHorizontal: 12,
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
                                isOtpValid && !isTimerExpired && !otpVerified
                                  ? "#FFFFFF"
                                  : "#8E8E8E",
                            }}
                          >
                            {verifyingOtp ? "확인중..." : "확인"}
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
                      <Pressable onPress={handleResendOtp} disabled={sendingOtp}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: isTimerExpired ? "#238AAF" : "#8D8D8D",
                          }}
                        >
                          재전송
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Continue Button */}
                <PrimaryButton
                  title="확인 및 계속"
                  onPress={handleContinue}
                  disabled={
                    otpVerified ? false : otpSent ? !isOtpValid || isTimerExpired : !isValid
                  }
                  loading={sendingOtp || verifyingOtp}
                />
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </AuthBackground>
  );
}
