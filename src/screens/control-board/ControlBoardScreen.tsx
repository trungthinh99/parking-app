import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Text } from "@/src/components/Text";
import { DonutChart } from "@/src/features/control-board/DonutChart";
import { Paper } from "@/src/components/Paper";
import { BottomNavBar } from "@/src/components/BottomNavBar";
import IconNotification from "@/src/assets/images/icons/icon-notification-24.svg";
import { Message } from "iconsax-react-native";
import dayjs from "@/src/lib/dayjs";
import { useMyProfile } from "@/src/query/hooks/use-auth-queries";
import { UserAvatar } from "@/src/components/UserAvatar";
import { getAvatarUrl } from "@/src/lib/avatar-url";
import { PATHS } from "@/constants/Paths";
import { useUnreadMessageCount } from "@/src/query/hooks/use-message-queries";
import { useSurveyProgress } from "@/src/query/hooks/use-survey-progress-queries";

/**
 * Control board page showing survey completion statistics
 */
export default function ControlBoardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: profile } = useMyProfile();
  const { data: unreadData } = useUnreadMessageCount();
  const { data: progress, isLoading, refetch: refetchProgress } = useSurveyProgress();
  const [refreshing, setRefreshing] = useState(false);
  const hasUnreadMessages = (unreadData?.unreadCount ?? 0) > 0;
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchProgress();
    setRefreshing(false);
  }, [refetchProgress]);

  const avatarUrl = getAvatarUrl(profile?.avatarPath);
  const userName = `${profile?.name || "app-user"} 화주님`;
  const currentDate = dayjs().format("YYYY년 MM월 DD일 dddd");

  const totalCompleted = progress?.totalCompleted ?? 0;
  const overallPercentage = progress?.overallPercent ?? 0;
  const surveyStats = progress?.byType ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerLeft}
          onPress={() => router.push("/(tabs)/settings/profile")}
          hitSlop={10}
        >
          <UserAvatar uri={avatarUrl} size={44} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.dateText}>{currentDate}</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconButton} hitSlop={10}>
            <IconNotification width={26} height={26} color="#FFFFFF" />
            <View style={styles.iconBadge} />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            hitSlop={10}
            onPress={() => router.push(PATHS.TABS.MESSAGES as any)}
          >
            <Message size={26} color="#FFFFFF" />
            {hasUnreadMessages && <View style={styles.iconBadge} />}
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#238AAF"]}
            tintColor="#238AAF"
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#238AAF" style={styles.loader} />
        ) : (
          <>
            {/* Title */}
            <Text style={styles.titleText}>
              현재 <Text style={styles.titleHighlight}>{totalCompleted}개</Text> 조사구역이
              완료되었습니다
            </Text>

            {/* Donut Chart */}
            <View style={styles.chartContainer}>
              <DonutChart
                percentage={overallPercentage}
                size={220}
                strokeWidth={9}
                ringGap={6}
                rings={surveyStats.map((stat, index) => ({
                  percentage: stat.percent,
                  color: stat.color,
                  strokeWidth: index < 2 ? 14 : 9,
                }))}
                trackColor="#E9E9E9"
                label="조사 완료율"
              />
            </View>

            {/* Stats Cards */}
            <View style={styles.statsList}>
              {surveyStats.map((stat) => (
                <Paper key={stat.parkingType} style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <View style={[styles.statDot, { backgroundColor: stat.color }]} />
                    <Text style={styles.statName}>{stat.name}</Text>
                  </View>
                  <View style={styles.statValues}>
                    {stat.total > 0 ? (
                      <Text style={styles.statCount}>
                        {stat.completed} / {stat.total}
                      </Text>
                    ) : (
                      <Text style={styles.noDataText}>데이터가 없습니다</Text>
                    )}
                    <Text style={styles.statPercentage}>{stat.percent}%</Text>
                  </View>
                </Paper>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#238AAF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTextContainer: {
    gap: 2,
  },
  dateText: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconBadge: {
    position: "absolute",
    top: 2,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3337",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentContainer: {
    padding: 20,
    alignItems: "center",
  },
  loader: {
    marginTop: 80,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#151515",
    textAlign: "center",
    marginBottom: 24,
  },
  titleHighlight: {
    fontSize: 24,
    fontWeight: "700",
    color: "#238AAF",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  statsList: {
    width: "100%",
    gap: 12,
  },
  statCard: {
    borderRadius: 12,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  statDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statName: {
    fontSize: 14,
    color: "#151515",
    fontWeight: "700",
  },
  statValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#151515",
  },
  statPercentage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#238AAF",
  },
  noDataText: {
    fontSize: 14,
    color: "#999999",
  },
});
