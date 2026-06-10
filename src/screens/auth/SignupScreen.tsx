import { Text } from "@/src/components/Text";
import { PATHS } from "@/constants/Paths";
import { Link, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Image, Keyboard, Pressable, TextInput, View } from "react-native";
import { useAppModal } from "@/src/hooks/useAppModal";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import dayjs from "@/src/lib/dayjs";
import IconCalendar from "@/src/assets/images/icons/icon-calendar-16.svg";
import { CalendarBottomSheet } from "@/src/components/CalendarBottomSheet";
import IconGalleryAdd from "@/src/assets/images/icons/icon-gallery-add-24.svg";
import IconTickCircle from "@/src/assets/images/icons/icon-tick-circle-16.svg";
import { AvatarUploadBottomSheet } from "@/src/features/settings/AvatarUploadBottomSheet";
import { AUTH_VALIDATION } from "@/src/api-contracts";
import { AuthBackground } from "@/src/features/auth/AuthBackground";
import { AuthCard } from "@/src/features/auth/AuthCard";
import { ControllerCheckbox } from "@/src/components/ControllerCheckbox";
import { ControllerInput } from "@/src/components/ControllerInput";
import { ControllerPasswordInput } from "@/src/components/ControllerPasswordInput";
import { InlineButton } from "@/src/components/InlineButton";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { SCREEN_IDS } from "@/src/api-contracts";
import { useSignupMutation } from "@/src/query/hooks/use-auth-queries";
import { useSendOtpMutation, useVerifyOtpMutation } from "@/src/query/hooks/use-otp-queries";
import {
  alertSignup,
  getSignupErrorMessage,
  validatePhoneOrAlert,
} from "@/src/screens/auth/signupActions";
import { formatPhoneNumber } from "@/src/lib/format-phone";

type SignupFormValues = {
  name: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  birthDate: string;
  email: string;
  inviteCode: string;
  agree: boolean;
};

// Field order for scroll-to-error
const FIELD_ORDER: (keyof SignupFormValues)[] = [
  "name",
  "password",
  "passwordConfirm",
  "phone",
  "birthDate",
  "inviteCode",
  "agree",
];

export default function SignupScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { noBack, inviteCode } = useLocalSearchParams<{ noBack?: string; inviteCode?: string }>();
  const { showModal } = useAppModal();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrollRef = useRef<any>(null);
  const fieldOffsets = useRef<Record<string, number>>({});
  const formContainerOffset = useRef(0);

  const sendOtpMutation = useSendOtpMutation();
  const verifyOtpMutation = useVerifyOtpMutation();
  const signupMutation = useSignupMutation();

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);

  // OTP states
  const OTP_TIMEOUT_SECONDS = 120;
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(OTP_TIMEOUT_SECONDS);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [timerKey, setTimerKey] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const otpInputRef = useRef<TextInput>(null);

  // Disable swipe-back gesture when navigated from FindIdErrorScreen
  useEffect(() => {
    if (noBack === "1") {
      navigation.setOptions({ gestureEnabled: false });
    }
  }, [noBack, navigation]);

  // OTP timer countdown
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
  }, [otpSent, otpVerified, timerKey]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };


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
      setAvatarUri(result.assets[0].uri);
    }
  }, []);

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
      setAvatarUri(result.assets[0].uri);
    }
  }, []);

  const { handleSubmit, control, getValues, setValue, watch, formState: { errors } } = useForm<SignupFormValues>({
    mode: "onChange",
    defaultValues: {
      name: "",
      password: "",
      passwordConfirm: "",
      phone: "",
      birthDate: "",
      email: "",
      inviteCode: typeof inviteCode === "string" ? inviteCode : "",
      agree: false,
    },
  });

  // Auto-fill invite code when param arrives async (e.g. from deep link)
  useEffect(() => {
    if (typeof inviteCode === "string" && inviteCode.length > 0) {
      setValue("inviteCode", inviteCode, { shouldValidate: false });
    }
  }, [inviteCode]);

  // Reset OTP state when phone number changes
  const watchedPhone = watch("phone");
  useEffect(() => {
    if (otpSent) {
      if (timerRef.current) clearInterval(timerRef.current);
      setOtpSent(false);
      setOtpCode("");
      setOtpError("");
      setOtpVerified(false);
      setVerificationToken("");
      setMaskedPhone("");
      setTimeLeft(OTP_TIMEOUT_SECONDS);
    }
  }, [watchedPhone]);

  const isOtpValid = otpCode.length === 6;
  const isTimerExpired = timeLeft === 0;

  const scrollToField = (fieldName: string) => {
    const y = fieldOffsets.current[fieldName];
    if (y !== undefined && scrollRef.current) {
      (scrollRef.current as any)?.scrollTo({
        y: Math.max(0, formContainerOffset.current + y - 20),
        animated: true,
      });
    }
  };

  const scrollToFirstError = (errors: Record<string, any>) => {
    for (const field of FIELD_ORDER) {
      if (errors[field]) {
        scrollToField(field);
        return;
      }
    }
  };

  const onPressSendOtp = () => {
    const phone = getValues("phone");
    if (!validatePhoneOrAlert(showModal, phone)) return;

    sendOtpMutation.mutate(
      { body: { context: "signup", destination: phone.trim() }, screenId: SCREEN_IDS.APP_AUTH_SIGNUP },
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
            alertSignup(showModal, res.message ?? "인증번호 전송에 실패했습니다.");
          }
        },
        onError: (e) => {
          alertSignup(showModal, getSignupErrorMessage(e));
        },
      }
    );
  };

  const onPressResendOtp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setOtpVerified(false);
    setVerificationToken("");
    setTimeLeft(OTP_TIMEOUT_SECONDS);
    setTimerKey((prev) => prev + 1);
    setOtpCode("");
    setOtpError("");
    onPressSendOtp();
  };

  const onPressVerifyOtp = () => {
    if (otpCode.length !== 6) return;

    const phone = getValues("phone");
    verifyOtpMutation.mutate(
      {
        body: { context: "signup", destination: phone.trim(), otp: otpCode },
        screenId: SCREEN_IDS.APP_AUTH_SIGNUP,
      },
      {
        onSuccess: (res) => {
          if (res.verified && res.verificationToken) {
            if (timerRef.current) clearInterval(timerRef.current);
            setOtpVerified(true);
            setVerificationToken(res.verificationToken);
          } else {
            setOtpError("잘못된 인증코드입니다. 다시 시도하세요.");
          }
        },
        onError: (e) => {
          setOtpError(getSignupErrorMessage(e));
        },
      }
    );
  };

  const onSubmit = handleSubmit(
    (values) => {
      if (!otpVerified) {
        alertSignup(showModal, "휴대폰 인증을 완료해주세요.");
        scrollToField("phone");
        return;
      }

      // Reject applicants under 18 years old (counted back from today)
      const birth = dayjs(values.birthDate.trim(), "YYYY.MM.DD");
      if (birth.isValid() && dayjs().diff(birth, "year") < 18) {
        alertSignup(showModal, "만 18세 미만은 조사원으로 가입할 수 없습니다!");
        scrollToField("birthDate");
        return;
      }

      signupMutation.mutate(
        {
          body: {
            name: values.name.trim(),
            password: values.password,
            phone: values.phone.trim(),
            birthDate: values.birthDate.trim(),
            email: values.email.trim() || undefined,
            inviteCode: values.inviteCode.trim(),
          },
          avatarUri,
        },
        {
          onSuccess: () => {
            showModal({
              title: "회원가입",
              message: "회원가입이 완료되었습니다.\n관리자 승인 후 이용 가능합니다.",
              buttons: [{ text: "확인", onPress: () => router.replace(PATHS.AUTH.LOGIN) }],
            });
          },
          onError: (e) => {
            showModal({ title: "회원가입", message: getSignupErrorMessage(e) });
          },
        }
      );
    },
    (errors) => {
      scrollToFirstError(errors);
    }
  );

  return (
    <>
      <AuthBackground>
      <AuthCard scrollable topOffset={2}>
        <KeyboardAwareScrollView
          ref={scrollRef}
          style={{
            flex: 1,
            borderRadius: 28,
          }}
          contentContainerStyle={{ paddingVertical: 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={true}
          bottomOffset={40}
          extraKeyboardSpace={20}
        >
          {/* Header */}
          <View style={{ padding: 16, alignItems: "center" }}>
            <Text
              style={{
                textAlign: "center",
                fontSize: 24,
                fontWeight: "600",
                color: "#151515",
                lineHeight: 34,
              }}
            >
              회원가입
            </Text>
          </View>

          {/* Avatar */}
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setShowAvatarSheet(true);
            }}
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: 120,
              width: 120,
              borderRadius: 60,
              backgroundColor: "#FAFAFA",
              alignSelf: "center",
              rowGap: 4,
              marginBottom: 24,
              overflow: "hidden",
            }}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={{ width: 120, height: 120 }} />
            ) : (
              <>
                <IconGalleryAdd width={24} height={24} />
                <Text style={{ fontSize: 12, color: "#8D8D8D" }}>프로필 사진 업로드</Text>
              </>
            )}
          </Pressable>

          {/* Form */}
          <View
            onLayout={(e) => {
              formContainerOffset.current = e.nativeEvent.layout.y;
            }}
            style={{ paddingHorizontal: 16, rowGap: 16 }}
          >
            {/* Name */}
            <View
              onLayout={(e) => {
                fieldOffsets.current.name = e.nativeEvent.layout.y;
              }}
            >
              <ControllerInput
                control={control}
                name="name"
                label="사용자명"
                required
                placeholder="이름을 입력하세요"
                rules={{
                  required: "필수 항목이 입력되지 않았습니다.",
                  minLength: {
                    value: 2,
                    message: "이름은 2~50자 이내로 입력하세요.",
                  },
                  maxLength: {
                    value: 50,
                    message: "이름은 2~50자 이내로 입력하세요.",
                  },
                }}
              />
            </View>

            {/* Password */}
            <View
              onLayout={(e) => {
                fieldOffsets.current.password = e.nativeEvent.layout.y;
              }}
              style={{ rowGap: 4 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  columnGap: 8,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#151515" }}>
                  비밀번호
                  <Text style={{ color: "#FF3337" }}> *</Text>
                </Text>
                <Text style={{ fontSize: 12, color: "#8D8D8D" }}>
                  {AUTH_VALIDATION.password.message}
                </Text>
              </View>
              <ControllerPasswordInput
                control={control}
                name="password"
                placeholder="비밀번호를 입력해주세요"
                rules={{
                  required: "필수 항목이 입력되지 않았습니다.",
                  pattern: {
                    value: AUTH_VALIDATION.password.pattern,
                    message: "비밀번호 형식이 올바르지 않습니다.",
                  },
                }}
              />
            </View>

            {/* Password Confirm */}
            <View
              onLayout={(e) => {
                fieldOffsets.current.passwordConfirm = e.nativeEvent.layout.y;
              }}
            >
              <ControllerPasswordInput
                control={control}
                name="passwordConfirm"
                label="비밀번호 확인"
                required
                placeholder="비밀번호를 다시 입력하세요"
                rules={{
                  required: "필수 항목이 입력되지 않았습니다.",
                  validate: (value) =>
                    value === getValues("password") || "비밀번호 확인이 일치하지 않습니다.",
                }}
              />
            </View>

            {/* Phone */}
            <View
              onLayout={(e) => {
                fieldOffsets.current.phone = e.nativeEvent.layout.y;
              }}
              style={{ rowGap: 4 }}
            >
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
                    required
                    placeholder="휴대폰 번호를 입력해주세요"
                    keyboardType="phone-pad"
                    maxLength={13}
                    hideError
                    editable={!otpSent}
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
                  title={sendOtpMutation.isPending ? "전송중..." : "인증코드 전송"}
                  onPress={onPressSendOtp}
                  disabled={sendOtpMutation.isPending || otpSent}
                />
              </View>
              {errors.phone?.message && !otpSent ? (
                <Text style={{ fontSize: 12, color: "#FF3337" }}>{errors.phone.message}</Text>
              ) : null}
            </View>

            {/* OTP Verification */}
            {otpSent && (
              <View style={{ rowGap: 12 }}>
                <View style={{ height: 1, backgroundColor: "#E5E5E5", marginVertical: 4 }} />

                <View style={{ rowGap: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#151515" }}>
                    인증 코드 검증
                  </Text>
                  <Text style={{ fontSize: 12, color: "#454545" }}>
                    {maskedPhone}으로 인증코드를 전송했습니다.
                  </Text>
                </View>

                {/* 6-digit OTP Input */}
                <View style={{ rowGap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#151515" }}>
                    6자리 인증코드
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
                        <Text style={{ fontSize: 14, fontWeight: "600", marginLeft: 8 }}>
                          {formatTime(timeLeft)}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={onPressVerifyOtp}
                      disabled={!isOtpValid || verifyOtpMutation.isPending || isTimerExpired || otpVerified}
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
                          color: isOtpValid && !isTimerExpired && !otpVerified ? "#FFFFFF" : "#8E8E8E",
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
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#454545" }}>코드를 받지 못하셨나요?</Text>
                  <Pressable onPress={onPressResendOtp} disabled={sendOtpMutation.isPending}>
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

            {/* Birth Date */}
            <View
              onLayout={(e) => {
                fieldOffsets.current.birthDate = e.nativeEvent.layout.y;
              }}
            >
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setCalendarVisible(true);
                }}
              >
                <View pointerEvents="none">
                  <ControllerInput
                    control={control}
                    name="birthDate"
                    label="생년월일"
                    required
                    placeholder="생년월일을 입력해주세요"
                    rules={{
                      required: "필수 항목이 입력되지 않았습니다.",
                    }}
                    right={<IconCalendar width={16} height={16} />}
                  />
                </View>
              </Pressable>
              <CalendarBottomSheet
                visible={calendarVisible}
                selectedDate={
                  getValues("birthDate") ? dayjs(getValues("birthDate"), "YYYY.MM.DD") : null
                }
                onClose={() => setCalendarVisible(false)}
                onConfirm={(date) => {
                  setValue("birthDate", date.format("YYYY.MM.DD"), {
                    shouldValidate: true,
                  });
                }}
              />
            </View>

            {/* Email */}
            <ControllerInput
              control={control}
              name="email"
              label="이메일 주소"
              placeholder="이메일을 입력하세요"
              rules={{
                pattern: {
                  value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "이메일 형식이 올바르지 않습니다.",
                },
              }}
            />

            {/* Invite / Company Code */}
            <View
              onLayout={(e) => {
                fieldOffsets.current.inviteCode = e.nativeEvent.layout.y;
              }}
              style={{ rowGap: 4 }}
            >
              <ControllerInput
                control={control}
                name="inviteCode"
                label="조사업체 코드"
                required
                placeholder="조사업체 코드를 입력해주세요"
                hideError
                autoCapitalize="none"
                rules={{
                  required: "필수 항목이 입력되지 않았습니다.",
                }}
              />
              {errors.inviteCode?.message ? (
                <Text style={{ fontSize: 12, color: "#FF3337" }}>{errors.inviteCode.message}</Text>
              ) : null}
            </View>

            {/* Checkbox */}
            <View
              onLayout={(e) => {
                fieldOffsets.current.agree = e.nativeEvent.layout.y;
              }}
              style={{ marginTop: 8 }}
            >
              <ControllerCheckbox
                control={control}
                name="agree"
                label="이용약관 및 개인정보보호 약관에 동의합니다"
                rules={{
                  validate: (value) =>
                    value === true || "이용약관에 동의해주세요.",
                }}
              />
            </View>
          </View>

          {/* Bottom Buttons */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 24,
              rowGap: 16,
            }}
          >
            <PrimaryButton title="회원가입" onPress={onSubmit} loading={signupMutation.isPending} />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                columnGap: 4,
              }}
            >
              <Text style={{ fontSize: 14, color: "#454545" }}>이미 계정이 있으신가요?</Text>
              <Link href={PATHS.AUTH.LOGIN} asChild>
                <Pressable accessibilityRole="button">
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#151515",
                    }}
                  >
                    로그인
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </AuthCard>
      </AuthBackground>
      <AvatarUploadBottomSheet
        visible={showAvatarSheet}
        onClose={() => setShowAvatarSheet(false)}
        onPickFromLibrary={handlePickFromLibrary}
        onTakePhoto={handleTakePhoto}
      />
    </>
  );
}
