import React, { useState } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { Text } from "@/src/components/Text";
import { SectionHeader, RadioButton } from "../StreetParkingBottomSheetContent";

// Radio options for dedicated parking areas
const DEDICATED_OPTIONS = ["장애인", "경차", "가족배려", "전기차", "나눔카", "임산부", "기타"];

// Vehicle type radio options
const VEHICLE_TYPES = [
  "승용차",
  "승합차",
  "화물차",
  "이륜차",
  "관광(대)",
  "관광(중)",
  "관광(소)",
  "기타",
  "주차차량 없음",
];

// Parking form radio options
const PARKING_FORM_OPTIONS = ["합법", "불법"];

/**
 * Usage status tab content (이용실태)
 * Contains: parking zone, dedicated parking, vehicle type, parking form
 */
export function UsageStatusContent() {
  // Parking zone: 유/무
  const [hasParkingZone, setHasParkingZone] = useState<"yes" | "no">("yes");

  // Dedicated parking area selection (single choice)
  const [dedicatedSelection, setDedicatedSelection] = useState<string | null>(null);

  // Other text input for dedicated parking
  const [dedicatedOtherText, setDedicatedOtherText] = useState("");

  // Vehicle type
  const [vehicleType, setVehicleType] = useState<string>("승용차");

  // Parking form
  const [parkingForm, setParkingForm] = useState<string>("합법");

  return (
    <View>
      {/* Section: Parking zone (주차구획) */}
      <View style={styles.section}>
        <SectionHeader title="주차구획" />
        <View style={styles.radioGroup}>
          <RadioButton
            selected={hasParkingZone === "yes"}
            onPress={() => setHasParkingZone("yes")}
            label="유"
          />
          <RadioButton
            selected={hasParkingZone === "no"}
            onPress={() => setHasParkingZone("no")}
            label="무"
          />
        </View>
      </View>

      {/* Section: Dedicated parking area (전용 주차구획) */}
      <View style={styles.section}>
        <SectionHeader title="전용 주차구획" />
        <View style={styles.checkboxGrid}>
          {DEDICATED_OPTIONS.map((option) => (
            <RadioButton
              key={option}
              selected={dedicatedSelection === option}
              onPress={() => setDedicatedSelection(option)}
              label={option}
            />
          ))}
        </View>
        {dedicatedSelection === "기타" && (
          <TextInput
            style={styles.textInput}
            placeholder="내용을 입력하세요."
            placeholderTextColor="#BDBDBD"
            value={dedicatedOtherText}
            onChangeText={setDedicatedOtherText}
          />
        )}
      </View>

      {/* Section: Vehicle type (차량종류) */}
      {/* <View style={styles.section}>
        <SectionHeader title="차량종류" />
        <View style={styles.checkboxGrid}>
          {VEHICLE_TYPES.map((type) => (
            <RadioButton
              key={type}
              selected={vehicleType === type}
              onPress={() => setVehicleType(type)}
              label={type}
            />
          ))}
        </View>
      </View> */}

      {/* Section: Parking form (주차형태) */}
      {/* <View style={[styles.section, { borderBottomWidth: 0 }]}>
        <SectionHeader title="주차형태" />
        <View style={styles.radioGroup}>
          {PARKING_FORM_OPTIONS.map((option) => (
            <RadioButton
              key={option}
              selected={parkingForm === option}
              onPress={() => setParkingForm(option)}
              label={option}
            />
          ))}
        </View>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9E9E9",
  },
  radioGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  textInput: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9E9E9",
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: "400" as const,
    color: "#151515",
    width: "48.5%",
  },
});
