import { Modal, Pressable, ScrollView, View } from "react-native";
import { Text } from "./Text";

import { REGION1_OPTIONS, REGION_MAP } from "@/src/api-contracts";

import { PrimaryButton } from "@/src/components/PrimaryButton";

type RegionPickerModalProps = {
  visible: boolean;
  region1: string;
  region2: string;
  onChangeRegion1: (next: string) => void;
  onChangeRegion2: (next: string) => void;
  onClose: () => void;
  onDone: () => void;
};

export function RegionPickerModal({
  visible,
  region1,
  region2,
  onChangeRegion1,
  onChangeRegion2,
  onClose,
  onDone,
}: RegionPickerModalProps) {
  const region2Options = region1 ? (REGION_MAP[region1] ?? []) : [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} onPress={onClose}>
        <Pressable
          style={{
            marginHorizontal: 16,
            marginTop: 140,
            maxHeight: "70%",
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 16,
            rowGap: 12,
          }}
          onPress={() => undefined}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#151515",
              textAlign: "center",
            }}
          >
            조사 지역 선택
          </Text>

          <View
            style={{
              flexDirection: "row",
              columnGap: 12,
              flex: 1,
              minHeight: 200,
            }}
          >
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, color: "#8D8D8D", marginBottom: 8 }}>시/도</Text>
              {REGION1_OPTIONS.map((r) => (
                <Pressable
                  key={r}
                  accessibilityRole="button"
                  onPress={() => {
                    onChangeRegion1(r);
                    const newRegion2Options = REGION_MAP[r] ?? [];
                    onChangeRegion2(newRegion2Options[0] ?? "");
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: region1 === r ? "#E6F3F7" : "#F4F4F4",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#151515",
                      fontWeight: region1 === r ? "700" : "400",
                    }}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, color: "#8D8D8D", marginBottom: 8 }}>구/군</Text>
              {region2Options.map((r) => (
                <Pressable
                  key={r}
                  accessibilityRole="button"
                  onPress={() => onChangeRegion2(r)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: region2 === r ? "#E6F3F7" : "#F4F4F4",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#151515",
                      fontWeight: region2 === r ? "700" : "400",
                    }}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <PrimaryButton title="선택 완료" onPress={onDone} disabled={!region1 || !region2} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
