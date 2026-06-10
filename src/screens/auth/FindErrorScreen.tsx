import { PATHS } from "@/constants/Paths";
import { useRouter } from "expo-router";
import { Image, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthBackground } from "@/src/features/auth/AuthBackground";
import { AuthCard } from "@/src/features/auth/AuthCard";
import { Text } from "@/src/components/Text";

export default function FindErrorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleGoToLogin = () => {
    router.replace(PATHS.AUTH.LOGIN);
  };

  const handleGoToSignup = () => {
    router.dismissAll();
    router.replace({ pathname: PATHS.AUTH.SIGNUP, params: { noBack: "1" } });
  };

  return (
    <AuthBackground>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            paddingTop: insets.top,
          }}
        >
          {/* Error Icon */}
          <View
            style={{
              alignItems: "center",
              paddingTop: 10,
              paddingBottom: 16,
            }}
          >
            <Image
              source={require("@/src/assets/images/error_icon.png")}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
          </View>

          {/* Card */}
          <AuthCard fitContent topOffset={-20}>
            <View style={{ rowGap: 32 }}>
              {/* Title & Subtitle */}
              <View style={{ alignItems: "center", rowGap: 4, marginTop: 16 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "600",
                    color: "#151515",
                    lineHeight: 34,
                  }}
                >
                  본인인증 실패
                </Text>
                <Text style={{ fontSize: 14, color: "#151515" }}>
                  가입한 이력이 없습니다.
                </Text>
              </View>

              {/* Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  columnGap: 8,
                  marginBottom: 16
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

                {/* Signup Button (Primary) */}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleGoToSignup}
                  style={{
                    flex: 1,
                    backgroundColor: "#238AAF",
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
                      color: "#FFFFFF",
                    }}
                  >
                    회원가입
                  </Text>
                </Pressable>
              </View>
            </View>
          </AuthCard>
        </View>
      </View>
    </AuthBackground>
  );
}
