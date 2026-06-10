import { PATHS } from "@/constants/Paths";
import LogoParking from "@/src/assets/images/logo-parking.png";
import { AUTH_VALIDATION } from "@/src/api-contracts";
import { ControllerCheckbox } from "@/src/components/ControllerCheckbox";
import { ControllerInput } from "@/src/components/ControllerInput";
import { ControllerPasswordInput } from "@/src/components/ControllerPasswordInput";
import { LoadingOverlay } from "@/src/components/LoadingOverlay";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { Text } from "@/src/components/Text";
import { AuthBackground } from "@/src/features/auth/AuthBackground";
import { AuthCard } from "@/src/features/auth/AuthCard";
import { getSavedPhone } from "@/src/lib/auth-storage";
import { formatPhoneNumber } from "@/src/lib/format-phone";
import { useLoginMutation } from "@/src/query";
import { useFocusEffect, Link } from "expo-router";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Image, Keyboard, Pressable, TouchableWithoutFeedback, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LoginFormValues = {
  phone: string;
  password: string;
  saveId: boolean;
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const loginMutation = useLoginMutation();

  const {
    handleSubmit,
    formState: { isValid },
    control,
    setValue,
  } = useForm<LoginFormValues>({
    mode: "onChange",
    defaultValues: {
      phone: "",
      password: "",
      saveId: false,
    },
  });

  // Restore saved phone every time screen is focused (e.g. after logout)
  useFocusEffect(
    useCallback(() => {
      // Reset password field on re-focus
      setValue("password", "");
      getSavedPhone().then((saved) => {
        if (saved) {
          setValue("phone", saved, { shouldValidate: true });
          setValue("saveId", true);
        } else {
          setValue("phone", "");
          setValue("saveId", false);
        }
      });
    }, [setValue]),
  );

  const onSubmit = handleSubmit((values) => {
    Keyboard.dismiss();
    loginMutation.mutate({
      phone: values.phone.trim(),
      password: values.password,
      saveId: values.saveId,
    });
  });

  return (
    <AuthBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <View
            style={{
              alignItems: "center",
              paddingTop: insets.top + 23,
              rowGap: 2,
              position: "absolute",
              left: 0,
              right: 0,
              zIndex: 1,
            }}
          >
            <Image source={LogoParking} style={{ width: 48, height: 48 }} />
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
              주차실태조사 솔루션
            </Text>
          </View>
          <AuthCard topOffset={124}>
            <View style={{ justifyContent: "space-between", flex: 1 }}>
              <View style={{ rowGap: 24 }}>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 24,
                    fontWeight: "600",
                    color: "#151515",
                    lineHeight: 34,
                  }}
                >
                  로그인
                </Text>

                <View style={{ rowGap: 16 }}>
                  <ControllerInput
                    control={control}
                    name="phone"
                    label="휴대폰 번호"
                    placeholder="휴대폰 번호를 입력하세요"
                    keyboardType="phone-pad"
                    maxLength={13}
                    formatValue={formatPhoneNumber}
                    rules={{
                      required: "필수 항목이 입력되지 않았습니다.",
                      pattern: {
                        value: AUTH_VALIDATION.phone.pattern,
                        message: "휴대폰 번호 형식이 올바르지 않습니다.",
                      },
                    }}
                  />

                  <ControllerPasswordInput
                    control={control}
                    name="password"
                    label="비밀번호"
                    placeholder="비밀번호를 입력하세요"
                    rules={{
                      required: "필수 항목이 입력되지 않았습니다.",
                    }}
                  />

                  <ControllerCheckbox control={control} name="saveId" label="휴대폰 번호 저장" />
                </View>

                <PrimaryButton title="로그인" onPress={onSubmit} disabled={!isValid} />

                <Link href={PATHS.AUTH.FIND_PASSWORD} asChild>
                  <Pressable accessibilityRole="button">
                    <Text
                      style={{
                        textAlign: "center",
                        fontSize: 14,
                        color: "#454545",
                      }}
                    >
                      비밀번호를 잊으셨나요?
                    </Text>
                  </Pressable>
                </Link>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  columnGap: 4,
                  marginTop: 24,
                }}
              >
                <Text style={{ fontSize: 14, color: "#454545" }}>아직 회원이 아니신가요?</Text>
                <Link href={PATHS.AUTH.SIGNUP} asChild>
                  <Pressable accessibilityRole="button">
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#151515",
                      }}
                    >
                      회원가입
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </AuthCard>
        </View>
      </TouchableWithoutFeedback>
      <LoadingOverlay visible={loginMutation.isPending} />
    </AuthBackground>
  );
}
