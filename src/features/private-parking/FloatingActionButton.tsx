import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle, View } from "react-native";
import Svg, { Path, G, Circle } from "react-native-svg";

type IconType = "gps" | "task";

interface FloatingActionButtonProps {
  icon: IconType;
  onPress: () => void;
  style?: ViewStyle;
}

// GPS icon (vuesax/linear/gps)
const GpsIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 19.5C16.1421 19.5 19.5 16.1421 19.5 12C19.5 7.85786 16.1421 4.5 12 4.5C7.85786 4.5 4.5 7.85786 4.5 12C4.5 16.1421 7.85786 19.5 12 19.5Z"
      stroke="#454545"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="#454545"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 4V2"
      stroke="#454545"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 12H2"
      stroke="#454545"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 20V22"
      stroke="#454545"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 12H22"
      stroke="#454545"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Task icon (vuesax/linear/task)
const TaskIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12.37 8.88H17.62"
      stroke="#454545"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.38 8.88L7.13 9.63L9.38 7.38"
      stroke="#454545"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.37 15.88H17.62"
      stroke="#454545"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.38 15.88L7.13 16.63L9.38 14.38"
      stroke="#454545"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
      stroke="#454545"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconMap: Record<IconType, React.FC> = {
  gps: GpsIcon,
  task: TaskIcon,
};

/**
 * Floating action button with icon
 * Used for GPS and Task list buttons on the map screen
 */
export function FloatingActionButton({ icon, onPress, style }: FloatingActionButtonProps) {
  const Icon = IconMap[icon];

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} activeOpacity={0.8}>
      <Icon />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
