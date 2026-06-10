import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { Text } from "@/src/components/Text";

interface RingData {
  /** Percentage value (0-100) */
  percentage: number;
  /** Color for this ring */
  color: string;
  /** Optional stroke width override for this ring */
  strokeWidth?: number;
}

interface DonutChartProps {
  /** Overall percentage to display in center */
  percentage: number;
  /** Size of the chart */
  size?: number;
  /** Stroke width for each ring */
  strokeWidth?: number;
  /** Gap between rings */
  ringGap?: number;
  /** Ring data array (outermost to innermost) */
  rings?: RingData[];
  /** Background track color */
  trackColor?: string;
  /** Label to show below percentage */
  label?: string;
}

/**
 * A donut chart component with multiple concentric rings
 * that displays percentage values with customizable colors
 */
export function DonutChart({
  percentage,
  size = 120,
  strokeWidth = 12,
  ringGap = 8,
  rings = [],
  trackColor = "#E9E9E9",
  label,
}: DonutChartProps) {
  const center = size / 2;

  // Calculate radius for each ring, accounting for per-ring strokeWidth
  const getRingRadius = (index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const prevWidth = rings[i]?.strokeWidth ?? strokeWidth;
      const currWidth = rings[i + 1]?.strokeWidth ?? strokeWidth;
      offset += prevWidth / 2 + ringGap + currWidth / 2;
    }
    const firstWidth = rings[0]?.strokeWidth ?? strokeWidth;
    return (size - firstWidth) / 2 - offset;
  };

  // Start from bottom (90 degrees)
  const rotation = 90;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {rings.map((ring, index) => {
            const ringStrokeWidth = ring.strokeWidth ?? strokeWidth;
            const radius = getRingRadius(index);
            const circumference = 2 * Math.PI * radius;
            const strokeDash = (Math.min(ring.percentage, 100) / 100) * circumference;

            return (
              <React.Fragment key={index}>
                {/* Background track */}
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={trackColor}
                  strokeWidth={ringStrokeWidth}
                  fill="transparent"
                />
                {/* Filled portion — skip when 0% to avoid round linecap dot */}
                {ring.percentage > 0 && (
                  <G transform={`rotate(${rotation}, ${center}, ${center})`}>
                    <Circle
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke={ring.color}
                      strokeWidth={ringStrokeWidth}
                      fill="transparent"
                      strokeDasharray={`${strokeDash} ${circumference}`}
                      strokeLinecap="round"
                    />
                  </G>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
        {/* Center text */}
        <View style={[styles.centerTextContainer, { width: size, height: size }]}>
          <Text style={[styles.percentageText, { fontSize: size * 0.15 }]}>{percentage}%</Text>
          {label && <Text style={[styles.labelText, { fontSize: size * 0.065 }]}>{label}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  percentageText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#151515",
  },
  labelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#454545",
    marginTop: 2,
  },
});
