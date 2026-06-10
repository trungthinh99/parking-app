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

import { SCREEN_IDS, type SurveyListItem } from "@/src/api-contracts";
import { Text } from "@/src/components/Text";
import { AlertBottomSheet } from "@/src/components/AlertBottomSheet";
import { useAppStore } from "@/src/store/app-store";
import { useAppToast } from "@/src/hooks/useAppToast";
import { useSurveyList, useUpdateParkingLot } from "@/src/query/hooks/use-parking-lot-queries";
import {
  PrivateSortBottomSheet,
  PrivateCompletedSortBottomSheet,
  type PrivateStatusKey,
  type ParkingDataTypeKey,
  type CompletedParkingTypeKey,
  type PrivateFilterResult,
  type PrivateCompletedFilterResult,
  PRIVATE_STATUS_DEFAULT,
  PARKING_TYPE_DEFAULT,
  COMPLETED_PARKING_TYPE_DEFAULT,
} from "./PrivateSortBottomSheet";

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
 * Private Parking Survey Zone Management screen (부설 조사 구역 관리)
 */
export default function PrivateSurveyZoneScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setPendingFocusMarker = useAppStore((s) => s.setPendingFocusMarker);
  const { showToast } = useAppToast();
  const [activeTab, setActiveTab] = useState<Tab>("data");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [sortFilters, setSortFilters] = useState<Record<PrivateStatusKey, boolean>>({
    ...PRIVATE_STATUS_DEFAULT,
  });
  const [parkingTypeFilters, setParkingTypeFilters] = useState<Record<ParkingDataTypeKey, boolean>>({
    ...PARKING_TYPE_DEFAULT,
  });
  const [completedSortSheetVisible, setCompletedSortSheetVisible] = useState(false);
  const [completedParkingTypeFilters, setCompletedParkingTypeFilters] = useState<Record<CompletedParkingTypeKey, boolean>>({
    ...COMPLETED_PARKING_TYPE_DEFAULT,
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
      .map(([k]) => k as PrivateStatusKey);
    return statusKeys.length > 0 && statusKeys.length < 3 ? statusKeys.join(",") : undefined;
  })();

  // Build isCreatedByApp + isUpdated filters from parking data type (주차 유형)
  const { isCreatedByAppParam, isUpdatedParam } = (() => {
    if (activeTab === "data") {
      const { existing, newlyRegistered } = parkingTypeFilters;
      const icba = existing === newlyRegistered ? undefined : newlyRegistered ? true : false;
      return { isCreatedByAppParam: icba, isUpdatedParam: undefined };
    }
    // Completed tab has 3 options: existingData, updatedData, newlyRegistered
    const { existingData, updatedData, newlyRegistered } = completedParkingTypeFilters;
    // If all selected or all deselected → no filter
    if (existingData === updatedData && updatedData === newlyRegistered) {
      return { isCreatedByAppParam: undefined, isUpdatedParam: undefined };
    }
    // newlyRegistered = isCreatedByApp true; existingData+updatedData = isCreatedByApp false
    let icba: boolean | undefined;
    if (newlyRegistered && !existingData && !updatedData) icba = true;
    else if (!newlyRegistered && (existingData || updatedData)) icba = false;
    else icba = undefined;
    // existingData = isUpdated false; updatedData = isUpdated true
    let iu: boolean | undefined;
    if (existingData && !updatedData) iu = false;
    else if (!existingData && updatedData) iu = true;
    else iu = undefined;
    return { isCreatedByAppParam: icba, isUpdatedParam: iu };
  })();

  // Whether filter is active (any criterion deselected)
  const isFilterActive = (() => {
    if (activeTab === "data") {
      const allStatusSelected = Object.values(sortFilters).every(Boolean);
      const allParkingTypeSelected = Object.values(parkingTypeFilters).every(Boolean);
      return !allStatusSelected || !allParkingTypeSelected;
    }
    return !Object.values(completedParkingTypeFilters).every(Boolean);
  })();

  const { data, isLoading, refetch, isRefetching } = useSurveyList(
    activeTab,
    SCREEN_IDS.APP_SURVEY_ZONE_MANAGEMENT,
    "building",
    statusParam,
    isCreatedByAppParam,
    undefined, // onStreetSubType
    isUpdatedParam,
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
    // Private: createdByApp → 'createdByApp', updated → 'updated', else 'building'
    const markerType = item.isCreatedByApp ? "createdByApp" : item.isUpdated ? "updated" : "building";
    setPendingFocusMarker({
      id: item.id,
      lat: item.lat,
      lng: item.lng,
      markerType,
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
            <View
              style={[
                styles.colorIndicator,
                isCompletedTab
                  ? item.isCreatedByApp
                    ? styles.colorIndicatorNew
                    : item.isUpdated
                      ? styles.colorIndicatorCompleted
                      : styles.colorIndicatorExisting
                  : item.isCreatedByApp
                    ? styles.colorIndicatorNew
                    : styles.colorIndicatorExisting,
              ]}
            />
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
      <PrivateSortBottomSheet
        visible={sortSheetVisible}
        onClose={() => setSortSheetVisible(false)}
        onSearch={(result: PrivateFilterResult) => {
          setSortFilters(result.status);
          setParkingTypeFilters(result.parkingDataType);
        }}
      />

      {/* Sort filter bottom sheet (completed tab) */}
      <PrivateCompletedSortBottomSheet
        visible={completedSortSheetVisible}
        onClose={() => setCompletedSortSheetVisible(false)}
        onSearch={(result: PrivateCompletedFilterResult) => {
          setCompletedParkingTypeFilters(result.parkingDataType);
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
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  colorIndicatorExisting: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#072AC8",
  },
  colorIndicatorNew: {
    backgroundColor: "#10A671",
  },
  colorIndicatorCompleted: {
    backgroundColor: "#072AC8",
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
