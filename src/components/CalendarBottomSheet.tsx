import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View, TouchableOpacity, FlatList } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Text } from "@/src/components/Text";
import { InlineButton } from "@/src/components/InlineButton";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Dayjs } from "dayjs";
import dayjs from "@/src/lib/dayjs";

// ── Calendar utilities ──

// Week starts on Monday
const DAY_HEADERS = ["월", "화", "수", "목", "금", "토", "일"] as const;

interface CalendarDay {
  date: Dayjs;
  isCurrentMonth: boolean;
}

/**
 * Generates a 6×7 grid of calendar days for display.
 * Week starts on Monday (0=Mon, 6=Sun).
 */
function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const startOfMonth = dayjs().year(year).month(month).startOf("month");
  // Convert Sunday-based (0=Sun) to Monday-based (0=Mon)
  const firstDayRaw = startOfMonth.day(); // 0=Sun, 1=Mon, ..., 6=Sat
  const firstDayMondayBased = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const daysInMonth = startOfMonth.daysInMonth();

  const days: CalendarDay[] = [];

  // Previous month trailing days
  for (let i = firstDayMondayBased - 1; i >= 0; i--) {
    days.push({
      date: startOfMonth.subtract(i + 1, "day"),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 0; d < daysInMonth; d++) {
    days.push({
      date: startOfMonth.add(d, "day"),
      isCurrentMonth: true,
    });
  }

  // Next month leading days to fill remaining cells (always 42 = 6 rows)
  const remaining = 42 - days.length;
  const endOfMonth = startOfMonth.endOf("month");
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: endOfMonth.add(d, "day"),
      isCurrentMonth: false,
    });
  }

  return days;
}

// ── Component ──

type ViewMode = "day" | "month" | "year";

interface CalendarBottomSheetProps {
  visible: boolean;
  selectedDate: Dayjs | null;
  onClose: () => void;
  onConfirm: (date: Dayjs) => void;
}

const ANIMATION_DURATION = 300;
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

const MIN_YEAR = 1940;
const MAX_YEAR = dayjs().year();
// Generate year list in descending order (newest first)
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i);

/**
 * Calendar bottom sheet with day grid and month picker views.
 * Wrapped in Modal to render above all other content.
 */
export function CalendarBottomSheet({
  visible,
  selectedDate,
  onClose,
  onConfirm,
}: CalendarBottomSheetProps) {
  const today = dayjs();
  const insets = useSafeAreaInsets();

  // Internal selection state (committed only on 확인)
  const [tempDate, setTempDate] = useState<Dayjs>(selectedDate ?? today);
  const [viewYear, setViewYear] = useState((selectedDate ?? today).year());
  const [viewMonth, setViewMonth] = useState((selectedDate ?? today).month());
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  // Modal visibility control (keep modal mounted during close animation)
  const [modalVisible, setModalVisible] = useState(false);

  // Animation values
  const translateY = useSharedValue(500);
  const backdropOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);

  // Open: show modal first, then animate in
  useEffect(() => {
    if (visible) {
      const base = selectedDate ?? today;
      setTempDate(base);
      setViewYear(base.year());
      setViewMonth(base.month());
      setViewMode("day");
      setModalVisible(true);

      // Small delay to ensure modal is mounted before animating
      requestAnimationFrame(() => {
        isClosingRef.current = false;
        backdropOpacity.value = withTiming(1, {
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.ease),
        });
        translateY.value = withTiming(0, {
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.ease),
        });
      });
    }
  }, [visible]);

  // Close: animate out, then hide modal
  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    translateY.value = withTiming(500, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.ease),
    });
    backdropOpacity.value = withTiming(
      0,
      { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) },
      () => {
        runOnJS(setModalVisible)(false);
        runOnJS(onClose)();
      }
    );
  }, [onClose, translateY, backdropOpacity]);

  const handleConfirm = useCallback(() => {
    onConfirm(tempDate);
    handleClose();
  }, [tempDate, onConfirm, handleClose]);

  // ── Navigation ──

  const goToPrevMonth = () => {
    const prev = dayjs().year(viewYear).month(viewMonth).subtract(1, "month");
    setViewYear(prev.year());
    setViewMonth(prev.month());
  };

  const goToNextMonth = () => {
    const next = dayjs().year(viewYear).month(viewMonth).add(1, "month");
    setViewYear(next.year());
    setViewMonth(next.month());
  };

  // Reference to year FlatList for scrolling to selected year
  const yearListRef = useRef<FlatList<number>>(null);

  // ── Animated styles ──

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const calendarDays = generateCalendarDays(viewYear, viewMonth);

  return (
    <Modal
      visible={modalVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Blurred backdrop */}
        <Animated.View style={[styles.backdropContainer, backdropAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
            <BlurView
              intensity={14}
              tint="dark"
              style={StyleSheet.absoluteFill}
              experimentalBlurMethod="dimezisBlurView"
            />
            <View style={styles.backdropDimming} />
          </Pressable>
        </Animated.View>

        {/* Bottom sheet */}
        <Animated.View style={[styles.sheet, sheetAnimatedStyle, { paddingBottom: insets.bottom + 16 }]}>
          {/* Drag handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {viewMode === "day" ? (
            // ── Day Calendar View ──
            <View style={styles.calendarContainer}>
              {/* Month/Year header */}
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setViewMode("month")} activeOpacity={0.7}>
                  <Text style={styles.headerTitle}>
                    {viewYear}년 {viewMonth + 1}월
                  </Text>
                </TouchableOpacity>
                <View style={styles.navArrows}>
                  <TouchableOpacity
                    onPress={goToPrevMonth}
                    activeOpacity={0.7}
                    style={styles.arrowButton}
                  >
                    <ArrowLeft2 size={18} color="#151515" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={goToNextMonth}
                    activeOpacity={0.7}
                    style={styles.arrowButton}
                  >
                    <ArrowRight2 size={18} color="#151515" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Day headers */}
              <View style={styles.dayHeaderRow}>
                {DAY_HEADERS.map((d) => (
                  <View key={d} style={styles.dayHeaderCell}>
                    <Text style={styles.dayHeaderText}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={styles.gridContainer}>
                {Array.from({ length: 6 }).map((_, rowIdx) => (
                  <View key={rowIdx} style={styles.weekRow}>
                    {calendarDays.slice(rowIdx * 7, rowIdx * 7 + 7).map((cd, colIdx) => {
                      const isSelected = cd.date.isSame(tempDate, "day");
                      const isToday = cd.date.isSame(today, "day");

                      return (
                        <TouchableOpacity
                          key={`${rowIdx}-${colIdx}`}
                          style={styles.dayCell}
                          activeOpacity={0.7}
                          onPress={() => {
                            setTempDate(cd.date);
                            if (!cd.isCurrentMonth) {
                              setViewYear(cd.date.year());
                              setViewMonth(cd.date.month());
                            }
                          }}
                        >
                          <View style={styles.dayCellInner}>
                            {(isSelected || isToday) && (
                              <View
                                style={[
                                  styles.dayCellCircle,
                                  isSelected && styles.dayCellSelected,
                                  !isSelected && isToday && styles.dayCellToday,
                                ]}
                              />
                            )}
                            <Text
                              style={[
                                styles.dayText,
                                !cd.isCurrentMonth && styles.dayTextOtherMonth,
                                isSelected && styles.dayTextSelected,
                              ]}
                            >
                              {cd.date.date()}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          ) : viewMode === "month" ? (
            // ── Month Picker View ──
            <View style={styles.calendarContainer}>
              {/* Year header — centered, tappable to open year picker */}
              <View style={styles.headerRowCenter}>
                <TouchableOpacity
                  onPress={() => setViewMode("year")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.headerTitle}>{viewYear}년</Text>
                </TouchableOpacity>
              </View>

              {/* Month grid (3 rows × 4 columns) */}
              <View style={styles.monthGrid}>
                {MONTHS.map((label, idx) => {
                  const isSelected = viewYear === tempDate.year() && idx === tempDate.month();
                  return (
                    <TouchableOpacity
                      key={label}
                      style={styles.monthCell}
                      activeOpacity={0.7}
                      onPress={() => {
                        setViewMonth(idx);
                        // Update tempDate to reflect selected month
                        const newDate = tempDate.year(viewYear).month(idx);
                        setTempDate(newDate);
                        setViewMode("day");
                      }}
                    >
                      <View style={[styles.monthCellInner, isSelected && styles.monthCellSelected]}>
                        <Text style={[styles.monthText, isSelected && styles.monthTextSelected]}>
                          {label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            // ── Year Picker View ──
            <View style={styles.calendarContainer}>
              <View style={styles.headerRowCenter}>
                <Text style={styles.headerTitle}>년도 선택</Text>
              </View>

              <FlatList
                ref={yearListRef}
                data={YEARS}
                keyExtractor={(item) => item.toString()}
                style={styles.yearList}
                showsVerticalScrollIndicator={false}
                initialScrollIndex={YEARS.indexOf(viewYear)}
                getItemLayout={(_, index) => ({
                  length: 48,
                  offset: 48 * index,
                  index,
                })}
                renderItem={({ item: year }) => {
                  const isSelected = year === viewYear;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.yearItem}
                      onPress={() => {
                        setViewYear(year);
                        setViewMode("month");
                      }}
                    >
                      <View style={[styles.yearItemInner, isSelected && styles.yearItemSelected]}>
                        <Text style={[styles.yearText, isSelected && styles.yearTextSelected]}>
                          {year}년
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {/* Footer buttons */}
          <View style={styles.footer}>
            <InlineButton
              title="취소"
              variant="secondary"
              onPress={handleClose}
              style={styles.footerButton}
            />
            <InlineButton
              title="확인"
              variant="primary"
              onPress={handleConfirm}
              style={styles.footerButton}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Styles ──

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDimming: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(21, 21, 21, 0.6)",
  },

  // Bottom sheet
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
  },
  handleContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  handle: {
    width: 50,
    height: 6,
    borderRadius: 100,
    backgroundColor: "#E9E9E9",
  },

  // Calendar container
  calendarContainer: {
    paddingHorizontal: 24,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#151515",
  },
  navArrows: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrowButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  // Day headers
  dayHeaderRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#151515",
  },

  // Calendar grid
  gridContainer: {
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: CELL_SIZE,
  },
  dayCellInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellCircle: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  dayCellSelected: {
    backgroundColor: "#238AAF",
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: "#238AAF",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
  },
  dayTextOtherMonth: {
    color: "#BDBDBD",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Month grid
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  monthCell: {
    width: "25%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  monthCellInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  monthCellSelected: {
    backgroundColor: "#238AAF",
  },
  monthText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#151515",
  },
  monthTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Header centered (for month/year picker)
  headerRowCenter: {
    alignItems: "center",
    marginBottom: 16,
  },

  // Year list
  yearList: {
    height: 288,
    marginBottom: 16,
  },
  yearItem: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  yearItemInner: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  yearItemSelected: {
    backgroundColor: "#238AAF",
  },
  yearText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#151515",
  },
  yearTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Footer
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});
