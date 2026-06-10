import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft2, ArrowUp, Sort } from "iconsax-react-native";
import Svg, { Circle, Line } from "react-native-svg";

import { SCREEN_IDS, type SurveyListItem, type OnStreetSubType } from "@/src/api-contracts";
import { Text } from "@/src/components/Text";
import { AlertBottomSheet } from "@/src/components/AlertBottomSheet";
import { useAppStore } from "@/src/store/app-store";
import { useAppToast } from "@/src/hooks/useAppToast";
import { useSurveyList, useUpdateParkingLot } from "@/src/query/hooks/use-parking-lot-queries";
import {
  OnStreetSortBottomSheet,
  OnStreetCompletedSortBottomSheet,
  type OnStreetStatusKey,
  type OnStreetSubTypeKey,
  type OnStreetFilterResult,
  type OnStreetCompletedFilterResult,
  ON_STREET_STATUS_DEFAULT,
  ON_STREET_SUB_TYPE_DEFAULT,
} from "./OnStreetSortBottomSheet";

// Circle indicator for on_street parking type
// Matches canvas drawCircle on OnStreetKakaoMap: filled circle + optional red X
const ON_STREET_STYLES: Record<string, { fill: string; hasX: boolean }> = {
  on_street_legal_day: { fill: "#FFDA09", hasX: false },
  on_street_illegal_day: { fill: "#FFDA09", hasX: true },
  on_street_legal_night: { fill: "#2D2D2D", hasX: false },
  on_street_illegal_night: { fill: "#2D2D2D", hasX: true },
};

function CircleIndicator({ subType }: { subType?: OnStreetSubType | string | null }) {
  const style = ON_STREET_STYLES[subType ?? ""] ?? ON_STREET_STYLES.on_street_legal_day;
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Circle cx={7} cy={7} r={7} fill={style.fill} />
      {style.hasX && (
        <>
          <Line x1={4.5} y1={4.5} x2={9.5} y2={9.5} stroke="#FF4040" strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={9.5} y1={4.5} x2={4.5} y2={9.5} stroke="#FF4040" strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

// Status badge variants matching the Figma design
type SurveyStatus = "original" | "updated" | "new";

type Tab = "data" | "completed";

const STATUS_CONFIG: Record<
  SurveyStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  original: { label: "원본", bgColor: "#E9E9E9", textColor: "#454545" },
  updated: { label: "업데이트됨", bgColor: "#FFEAD2", textColor: "#EA8445" },
  new: { label: "신규", bgColor: "#D8D5FF", textColor: "#884CFF" },
};

// Derive display status from API item fields
function getItemStatus(item: SurveyListItem): SurveyStatus {
  if (item.isCreatedByApp && !item.isUpdated && !item.isDraft) return "new";
  if (item.isDraft) return "updated";
  return "original";
}

// Format ISO date string to YYYY.MM.DD
function formatDate(isoDate: string | null): string {
  if (!isoDate) return "-";
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

/**
 * On-Street Survey Zone Management screen (노상 조사 구역 관리)
 */
export default function OnStreetSurveyZoneScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setPendingFocusMarker = useAppStore((s) => s.setPendingFocusMarker);
  const { showToast } = useAppToast();
  const [activeTab, setActiveTab] = useState<Tab>("data");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [sortFilters, setSortFilters] = useState<Record<OnStreetStatusKey, boolean>>({
    ...ON_STREET_STATUS_DEFAULT,
  });
  const [subTypeFilters, setSubTypeFilters] = useState<Record<OnStreetSubTypeKey, boolean>>({
    ...ON_STREET_SUB_TYPE_DEFAULT,
  });
  const [completedSortSheetVisible, setCompletedSortSheetVisible] = useState(false);
  const [completedSubTypeFilters, setCompletedSubTypeFilters] = useState<Record<OnStreetSubTypeKey, boolean>>({
    ...ON_STREET_SUB_TYPE_DEFAULT,
  });

  // Complete (저장 및 완료) confirmation state
  const [confirmAlertVisible, setConfirmAlertVisible] = useState(false);
  const [confirmingItemId, setConfirmingItemId] = useState<number | null>(null);
  const updateMutation = useUpdateParkingLot(SCREEN_IDS.APP_SURVEY_ZONE_MANAGEMENT);

  // Build status filter string for API (only on data tab)
  const statusParam = (() => {
    if (activeTab !== "data") return undefined;
    const statusKeys = Object.entries(sortFilters)
      .filter(([, v]) => v)
      .map(([k]) => k as OnStreetStatusKey);
    return statusKeys.length > 0 && statusKeys.length < 2 ? statusKeys.join(",") : undefined;
  })();

  // Build onStreetSubType filter from sub-type checkboxes
  // All selected or all unselected → no filter (undefined)
  const onStreetSubTypeParam = (() => {
    const filters = activeTab === "data" ? subTypeFilters : completedSubTypeFilters;
    const selected = Object.entries(filters)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (selected.length === 0 || selected.length === 4) return undefined;
    return selected.join(",");
  })();

  // Whether filter is active (any criterion deselected)
  const isFilterActive = (() => {
    if (activeTab === "data") {
      const allStatusSelected = Object.values(sortFilters).every(Boolean);
      const allSubTypeSelected = Object.values(subTypeFilters).every(Boolean);
      return !allStatusSelected || !allSubTypeSelected;
    }
    return !Object.values(completedSubTypeFilters).every(Boolean);
  })();

  const { data, isLoading, refetch, isRefetching } = useSurveyList(
    activeTab,
    SCREEN_IDS.APP_SURVEY_ZONE_MANAGEMENT,
    "on_street",
    statusParam,
    undefined,
    onStreetSubTypeParam,
  );

  // Refetch when screen is focused
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  const isCompletedTab = activeTab === "completed";

  // Navigate back to map and focus on the selected marker
  const handleAddressPress = useCallback((item: SurveyListItem) => {
    // OnStreet uses onStreetSubType directly
    setPendingFocusMarker({
      id: item.id,
      lat: item.lat,
      lng: item.lng,
      markerType: undefined,
      onStreetSubType: item.onStreetSubType ?? undefined,
      isCompleted: isCompletedTab,
    });
    router.back();
  }, [setPendingFocusMarker, router, isCompletedTab]);

  // Arrow-up button: show confirmation alert
  const handleCompletePress = useCallback((itemId: number) => {
    setConfirmingItemId(itemId);
    setConfirmAlertVisible(true);
  }, []);

  // Confirm: call update API with isDraft=false to mark as completed
  const handleConfirmComplete = useCallback(() => {
    if (confirmingItemId === null) return;
    updateMutation.mutate(
      { id: confirmingItemId, data: { isDraft: false } },
      {
        onSuccess: () => {
          showToast({ message: "저장 및 완료되었습니다.", type: "success" });
          refetch();
        },
        onError: (error) => {
          showToast({ message: error.apiError?.message ?? "오류가 발생했습니다.", type: "error" });
        },
      },
    );
  }, [confirmingItemId, updateMutation, showToast, refetch]);

  const renderItem = useCallback(({ item }: { item: SurveyListItem }) => {
    const status = getItemStatus(item);
    const statusConfig = STATUS_CONFIG[status];
    return (
      <View style={styles.card}>
        {/* Left: address + zone info */}
        <View style={styles.cardLeft}>
          <Pressable style={styles.addressRow} onPress={() => handleAddressPress(item)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <CircleIndicator subType={item.onStreetSubType} />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.address ?? "-"}
            </Text>
          </Pressable>
          <Text style={styles.zoneText}>조사구역: {item.surveyArea ?? "-"}</Text>
          <Text style={styles.dateText}>
            {isCompletedTab ? "조사 일자" : "최종 수정일"}: {formatDate(item.lastModifiedDate)}
          </Text>
        </View>

        {/* Right: status badge + action button (only on data tab) */}
        {!isCompletedTab && (
          <View style={styles.cardRight}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}
            >
              <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                {statusConfig.label}
              </Text>
            </View>
            <Pressable style={styles.actionButton} hitSlop={10} onPress={() => handleCompletePress(item.id)}>
              <ArrowUp size={20} color="#151515" variant="Linear" />
            </Pressable>
          </View>
        )}
      </View>
    );
  }, [isCompletedTab]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <ArrowLeft2 size={20} color="#FFFFFF" variant="Linear" />
        </Pressable>
        <Text style={styles.headerTitle}>조사 구역 관리</Text>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === "data" && styles.tabActive]}
            onPress={() => setActiveTab("data")}
          >
            <Text
              style={[styles.tabText, activeTab === "data" && styles.tabTextActive]}
            >
              조사 데이터
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "completed" && styles.tabActive]}
            onPress={() => setActiveTab("completed")}
          >
            <Text
              style={[styles.tabText, activeTab === "completed" && styles.tabTextActive]}
            >
              조사 완료
            </Text>
          </Pressable>
        </View>

        {/* Count row + filter */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>전체 {total}건</Text>
          <Pressable
            style={[styles.filterButton, isFilterActive && styles.filterButtonActive]}
            hitSlop={10}
            onPress={() => isCompletedTab ? setCompletedSortSheetVisible(true) : setSortSheetVisible(true)}
          >
            <Sort size={20} color={isFilterActive ? "#FFFFFF" : "#151515"} variant="Linear" />
          </Pressable>
        </View>

        {/* List */}
        {isLoading && items.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#238AAF" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>데이터가 없습니다.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#238AAF"
              />
            }
          />
        )}
      </View>

      {/* Sort filter bottom sheet (data tab) */}
      <OnStreetSortBottomSheet
        visible={sortSheetVisible}
        onClose={() => setSortSheetVisible(false)}
        onSearch={(result: OnStreetFilterResult) => {
          setSortFilters(result.status);
          setSubTypeFilters(result.subType);
        }}
      />

      {/* Sort filter bottom sheet (completed tab) */}
      <OnStreetCompletedSortBottomSheet
        visible={completedSortSheetVisible}
        onClose={() => setCompletedSortSheetVisible(false)}
        onSearch={(result: OnStreetCompletedFilterResult) => {
          setCompletedSubTypeFilters(result.subType);
        }}
      />

      {/* Confirm complete alert */}
      <AlertBottomSheet
        visible={confirmAlertVisible}
        message={"저장하고 완료하시겠습니까?"}
        onClose={() => setConfirmAlertVisible(false)}
        buttons={[
          { label: "취소", variant: "secondary", onPress: () => {} },
          {
            label: "확인",
            variant: "primary",
            onPress: handleConfirmComplete,
            loading: updateMutation.isPending,
          },
        ]}
      />
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
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 5,
  },
  backButton: {
    position: "absolute",
    left: 10,
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.528,
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#238AAF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8D8D8D",
    letterSpacing: -0.308,
  },
  tabTextActive: {
    color: "#238AAF",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  countText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#151515",
    letterSpacing: -0.396,
  },
  filterButton: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#F4F4F4",
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#238AAF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#8D8D8D",
    letterSpacing: -0.308,
  },
  list: {
    flex: 1,
  },
  listContent: {
    marginTop: 12,
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.09,
    shadowRadius: 7,
    shadowOffset: { width: 1, height: 1 },
    ...Platform.select({
      android: {
        borderWidth: 1,
        borderColor: "rgba(241, 234, 234, 0.01)",
        boxShadow: "0px 0px 16px 0px rgba(21, 21, 21, 0.08)",
      },
    }),
  },
  cardLeft: {
    flex: 1,
    gap: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
    letterSpacing: -0.308,
  },
  zoneText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: -0.308,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#F4F4F4",
    justifyContent: "center",
    alignItems: "center",
  },
});
