import React from "react";
import { View, StyleSheet } from "react-native";
// import { TouchableOpacity } from "react-native"; // Temporarily hidden camera button
// import { Camera } from "iconsax-react-native"; // Temporarily hidden camera button
import { Control } from "react-hook-form";
// import { useWatch } from "react-hook-form"; // Temporarily hidden camera button
import { InlineButton } from "@/src/components/InlineButton";
import { ControllerCheckbox } from "@/src/components/ControllerCheckbox";

export type ActionBarFormValues = {
  isChecked: boolean;
};

export const ACTION_BAR_DEFAULT_VALUES: ActionBarFormValues = {
  isChecked: false,
};

interface ActionBarProps {
  control: Control<ActionBarFormValues>;
  /** When true, camera button stays active even if checkbox is unchecked */
  isCameraEnabled?: boolean;
  /** When true, render single 전송 button instead of 저장 + 저장 및 완료 */
  isCreateMode?: boolean;
  onCameraPress?: () => void;
  onDraftSave: () => void;
  onSubmit: () => void;
}

export function ActionBar({
  control,
  // isCameraEnabled, // Temporarily hidden camera button
  isCreateMode,
  // onCameraPress, // Temporarily hidden camera button
  onDraftSave,
  onSubmit,
}: ActionBarProps) {
  // Temporarily hidden camera button
  // const isChecked = useWatch({ control, name: "isChecked" });
  // const cameraActive = isChecked || !!isCameraEnabled;

  return (
    <View style={styles.actionBar}>
      <ControllerCheckbox
        control={control}
        name="isChecked"
        label="※(체크) 총주차 [ ]면 이상 및 특이사항 있을 때"
      />

      <View style={styles.buttonRow}>
        {/* Temporarily hidden camera button
        <TouchableOpacity
          style={[styles.cameraButton, !cameraActive && styles.cameraButtonDisabled]}
          onPress={onCameraPress}
          activeOpacity={0.7}
          disabled={!cameraActive}
        >
          <Camera size={20} color={cameraActive ? "#151515" : "#8D8D8D"} variant="Linear" />
        </TouchableOpacity>
        */}
        {isCreateMode ? (
          <InlineButton
            title="전송"
            variant="primary"
            onPress={onSubmit}
            style={styles.flexButton}
          />
        ) : (
          <>
            <InlineButton
              title="저장"
              variant="secondary"
              onPress={onDraftSave}
              style={styles.flexButton}
            />
            <InlineButton
              title="저장 및 완료"
              variant="primary"
              onPress={onSubmit}
              style={styles.flexButton}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E9E9E9",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  cameraButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F4F4F4",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButtonDisabled: {
    backgroundColor: "#E9E9E9",
  },
  flexButton: {
    flex: 1,
  },
});
