import React from "react";
import { Image } from "react-native";

interface ParkingSignIconProps {
  size?: number;
  color?: string;
  variant?: "Linear" | "Bold";
}

export function ParkingSignIcon({ size = 24, variant = "Linear" }: ParkingSignIconProps) {
  const source =
    variant === "Bold"
      ? require("@/src/assets/images/parking-sign-bold.png")
      : require("@/src/assets/images/parking-sign-line.png");

  return (
    <Image
      source={source}
      style={{
        width: size,
        height: size,
        resizeMode: "contain",
      }}
    />
  );
}
