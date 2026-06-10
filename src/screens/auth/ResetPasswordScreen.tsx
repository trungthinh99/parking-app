import { PATHS } from "@/constants/Paths";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { AUTH_VALIDATION } from "@/src/api-contracts";
import { ControllerPasswordInput } from "@/src/components/ControllerPasswordInput";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";

import { appResetPassword } from "@/src/api/auth";
import { ApiClientError } from "@/src/api/client";
import { AuthBackground } from "@/src/features/auth/AuthBackground";
import { AuthCard } from "@/src/features/auth/AuthCard";
import { Text } from "@/src/components/Text";

type ResetPasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone, verificationToken } = useLocalSearchParams<{
    phone: string;
    verificationToken: string;
  }>();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { isValid },
  } = useForm<ResetPasswordFormValues>({
    mode: "onChange",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const [isChanging, setIsChanging] = useState(false);

  const handleGoToLogin = () => {
    router.replace(PATHS.AUTH.LOGIN);
  };

  const handleChangePassword = handleSubmit(async (data) => {
    if (!phone || !verificationToken) {
      Alert.alert("오류", "잘못된 접근입니다. 다시 시도해 주세요.");
      router.replace(PATHS.AUTH.FIND_PASSWORD);
      return;
    }

    setIsChanging(true);
    try {
      await appResetPassword({
        phone,
        verificationToken,
        newPassword: data.newPassword,
      });
      Alert.alert(
        "비밀번호 변경 완료",
        "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해 주세요.",
        [{ text: "확인", onPress: () => router.replace(PATHS.AUTH.LOGIN) }]
      );
    } catch (e) {
      const message =
        e instanceof ApiClientError
          ? e.message
          : "비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      Alert.alert("오류", message);
    } finally {
      setIsChanging(false);
    }
  });

  return (
    <AuthBackground>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
        {/* Content */}
        <View
          style={{
            flex: 1,
            paddingTop: insets.top,
          }}
        >
          {/* Rotate Icon */}
          <View
            style={{
              alignItems: "center",
              paddingTop: 10,
              paddingBottom: 16,
            }}
          >
            <Image
              source={require("@/src/assets/images/rotate.png")}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
          </View>

          {/* Card */}
          <AuthCard fitContent topOffset={-10}>
            <View style={{ rowGap: 16 }}>
              {/* Title & Subtitle */}
              <View style={{ alignItems: "center", rowGap: 4 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "600",
                    color: "#151515",
                    lineHeight: 34,
                  }}
                >
                  새 비밀번호 설정
                </Text>
                <Text style={{ fontSize: 14, color: "#151515" }}>
                  새 계정 비밀번호를 입력하고 확인하세요.
                </Text>
              </View>

              {/* New Password Input */}
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

              {/* Confirm Password Input */}
              <ControllerPasswordInput
                control={control}
                name="confirmPassword"
                label="비밀번호 확인"
                placeholder="비밀번호를 다시 입력하세요"
                required
                rules={{
                  required: "필수 항목이 입력되지 않았습니다.",
                  validate: (value: string) =>
                    value === getValues("newPassword") || "비밀번호 확인이 일치하지 않습니다.",
                }}
              />

              {/* Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  columnGap: 8,
                }}
              >
                {/* Go to Login Button (Gray) */}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleGoToLogin}
                  style={{
                    flex: 1,
                    backgroundColor: "#F4F4F4",
                    borderRadius: 100,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#151515",
                    }}
                  >
                    로그인 페이지로 이동
                  </Text>
                </Pressable>

                {/* Change Password Button (Primary) */}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleChangePassword}
                  disabled={!isValid || isChanging}
                  style={{
                    flex: 1,
                    backgroundColor: "#238AAF",
                    borderRadius: 100,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: !isValid || isChanging ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                  >
                    {isChanging ? "변경 중..." : "비밀번호 변경"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </AuthCard>
        </View>
      </View>
    </TouchableWithoutFeedback>
    </AuthBackground>
  );
}
