import { PATHS } from "@/constants/Paths";
import { InlineButton } from "@/src/components/InlineButton";
import { Text } from "@/src/components/Text";
import { AuthBackground } from "@/src/features/auth/AuthBackground";
import { AuthCard } from "@/src/features/auth/AuthCard";
import { useAppToast } from "@/src/hooks/useAppToast";
import { getAccessToken } from "@/src/lib/auth-storage";
import {
  useInviteInfoQuery,
  useRespondRegionInviteByCode,
} from "@/src/query/hooks/use-invite-queries";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Location, TickCircle } from "iconsax-react-native";
import { ActivityIndicator, Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LogoParking from "@/src/assets/images/logo-parking.png";

export default function ReceiveInviteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useAppToast();
  const { accept } = useRespondRegionInviteByCode();
  const params = useLocalSearchParams<{
    code?: string;
    // legacy params (kept for backwards compat with older links, no longer trusted)
    token?: string;
    inviterName?: string;
    inviterRole?: string;
    expireDate?: string;
  }>();

  // Support both `?code=` (new) and `?token=` (legacy URLs still in the wild)
  const inviteCode = params.code ?? params.token;

  const { data: info, isLoading, isError } = useInviteInfoQuery(inviteCode);

  // const inviterName = info?.inviterName ?? params.inviterName ?? "P-SYS";
  const inviterName = "P-SYS";
  const inviterRole =
    params.inviterRole ??
    (info?.role === "surveyor" ? "주차실태조사" : (info?.role ?? "주차실태조사"));
  const expireDate = info?.expireDate ?? params.expireDate ?? "";
  const managedArea = info?.managedArea ?? "";
  const isValid = info ? info.valid : !isError && !!inviteCode;

  const handleDecline = async () => {
    // Source of truth for "is this a logged-in user?" is the stored access token,
    // NOT the auth store flag — the flag can lag/desync when this screen is opened
    // via a deep link (cold start, push), wrongly sending a logged-in user to login.
    const token = await getAccessToken();
    if (token) {
      // Logged-in user who reached this via deep link. We CANNOT use router.back():
      // on a cold start the link pushes this screen on top of login, so back() lands
      // on login. Navigate explicitly to the control board instead.
      router.replace(PATHS.TABS.CONTROL_BOARD);
      return;
    }
    router.replace(PATHS.AUTH.LOGIN);
  };

  const handleAccept = async () => {
    if (accept.isPending) return;

    // Read the real token rather than trusting the auth-store flag (see handleDecline).
    const token = await getAccessToken();

    // Already-logged-in surveyor → add the new survey region to their account
    // (promote/create the TBL_SURVEYOR_REGIONS grant) and return to the app.
    // They do NOT go through signup again.
    if (token) {
      if (!inviteCode) return;
      accept.mutate(inviteCode, {
        onSuccess: () => {
          showToast({ message: "새로운 조사 지역이 추가되었습니다.", type: "success" });
          // Explicit navigation, not router.back() — see handleDecline for why.
          router.replace(PATHS.TABS.CONTROL_BOARD);
        },
        onError: (error) => {
          showToast({
            message: error.apiError?.message ?? "처리 중 문제가 발생했습니다.",
            type: "error",
          });
        },
      });
      return;
    }

    // Not logged in → continue to signup with the invite code (original flow).
    router.replace({
      pathname: PATHS.AUTH.SIGNUP,
      params: inviteCode ? { inviteCode } : undefined,
    });
  };

  return (
    <AuthBackground>
      <View style={{ flex: 1 }}>
        {/* Header text */}
        <View
          style={{
            alignItems: "center",
            paddingTop: insets.top + 36,
            rowGap: 4,
            position: "absolute",
            left: 0,
            right: 0,
            zIndex: 1,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: "700",
              lineHeight: 22,
            }}
          >
            새로운 조직에서 귀하를 초대했습니다.
          </Text>
          <Text style={{ color: "#FFFFFF", fontSize: 14, lineHeight: 20 }}>
            초대 내용을 확인하시고 참여 여부를 결정해주세요.
          </Text>
        </View>

        <AuthCard topOffset={120}>
          <View style={{ justifyContent: "space-between", flex: 1 }}>
            <View style={{ rowGap: 16 }}>
              {/* Title */}
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#151515",
                  lineHeight: 26,
                }}
              >
                초대 상세 정보
              </Text>

              {isLoading ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <ActivityIndicator color="#238AAF" />
                </View>
              ) : !isValid ? (
                <View style={{ paddingVertical: 12 }}>
                  <Text style={{ fontSize: 14, color: "#D32F2F", textAlign: "center" }}>
                    초대가 만료되었거나 유효하지 않습니다.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Inviter info box */}
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#f0f0f0",
                      borderRadius: 14,
                      padding: 11,
                      rowGap: 4,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "500", color: "#2b2b2b" }}>
                      초대한 사람
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        columnGap: 12,
                      }}
                    >
                      <Image
                        source={LogoParking}
                        style={{ width: 36, height: 36 }}
                        resizeMode="contain"
                      />
                      <View style={{ rowGap: 2 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: "#151515",
                            lineHeight: 22,
                          }}
                        >
                          {inviterName}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#7A7A7A",
                            lineHeight: 18,
                            marginBottom: -2,
                          }}
                        >
                          {inviterRole}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Granted region box */}
                  {!!managedArea && (
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: "#f0f0f0",
                        borderRadius: 14,
                        padding: 11,
                        rowGap: 16,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "500", color: "#2b2b2b" }}>
                        조사 지역
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          columnGap: 8,
                        }}
                      >
                        <Location size={18} color="#151515" variant="Linear" />
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "#151515",
                            lineHeight: 20,
                          }}
                        >
                          {managedArea}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Expire date box */}
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#f0f0f0",
                      borderRadius: 14,
                      padding: 11,
                      rowGap: 16,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "500", color: "#2b2b2b" }}>
                      초대 만료일
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        columnGap: 8,
                      }}
                    >
                      <Calendar size={18} color="#151515" variant="Linear" />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#151515",
                          lineHeight: 20,
                        }}
                      >
                        {expireDate}
                      </Text>
                    </View>
                  </View>

                  {/* Notice */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      columnGap: 6,
                      paddingHorizontal: 4,
                    }}
                  >
                    <TickCircle
                      size={16}
                      color="#151515"
                      variant="Linear"
                      style={{ marginTop: 2 }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: "#151515",
                        lineHeight: 19,
                      }}
                    >
                      조직 참여 시 해당 소속의 공유 문서와 팀 프로젝트에 접근할 수 있는 권한이
                      부여됩니다. 본인이 맞는지 확인 후 수락해 주세요.
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Action buttons */}
            <View
              style={{
                flexDirection: "row",
                columnGap: 8,
                marginTop: 24,
              }}
            >
              <InlineButton
                title="거절하기"
                onPress={handleDecline}
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
                disabled={accept.isPending}
              />
              <InlineButton
                title="조직 참여하기"
                onPress={handleAccept}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
                disabled={!isValid || accept.isPending}
                loading={accept.isPending}
              />
            </View>
          </View>
        </AuthCard>
      </View>
    </AuthBackground>
  );
}
