import React from "react";
import Svg, { Circle, Line, Polygon, Rect } from "react-native-svg";

// Default sizes per shape (preserving original values)
const DEFAULT_SIZE: Record<"square" | "triangle" | "circle", number> = {
  square: 13 ,
  triangle: 14,
  circle: 14,
};

// Colored indicator for legend items
// shape: "square" for private, "triangle" for street, "circle" for onStreet
// outline: if true, draw white fill with colored border (for "existing" data)
// hasX: if true, draw an X mark inside (for illegal on-street markers)
// size: custom size in px (defaults vary by shape: square=10, triangle/circle=14)
export function LegendIndicator({
  color,
  outline,
  shape = "square",
  hasX,
  size,
}: {
  color: string;
  outline?: boolean;
  shape?: "square" | "triangle" | "circle";
  hasX?: boolean;
  size?: number;
}) {
  const s = size ?? DEFAULT_SIZE[shape];

  if (shape === "triangle") {
    const mid = s / 2;
    const points = `${mid},${s * (1 / 14)} ${s - s * (1 / 14)},${s - s * (1 / 14)} ${s * (1 / 14)},${s - s * (1 / 14)}`;
    return (
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Polygon
          points={points}
          fill={outline ? "#FFFFFF" : color}
          stroke={outline ? color : "none"}
          strokeWidth={outline ? s * (1.5 / 14) : 0}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (shape === "circle") {
    const half = s / 2;
    const strokeW = s * (2 / 14);
    const r = outline ? half - strokeW / 2 : half;
    const xOffset = s * (4.5 / 14);
    const xEnd = s - xOffset;
    return (
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Circle
          cx={half}
          cy={half}
          r={r}
          fill={outline ? "#FFFFFF" : color}
          stroke={outline ? color : "none"}
          strokeWidth={outline ? strokeW : 0}
        />
        {hasX && (
          <>
            <Line x1={xOffset} y1={xOffset} x2={xEnd} y2={xEnd} stroke="#FF4040" strokeWidth={s * (1.8 / 14)} strokeLinecap="round" />
            <Line x1={xEnd} y1={xOffset} x2={xOffset} y2={xEnd} stroke="#FF4040" strokeWidth={s * (1.8 / 14)} strokeLinecap="round" />
          </>
        )}
      </Svg>
    );
  }

  // Square (default)
  const strokeW = s * (2 / 10);
  const inset = outline ? strokeW / 2 : 0;
  const innerSize = outline ? s - strokeW : s;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Rect
        x={inset}
        y={inset}
        width={innerSize}
        height={innerSize}
        rx={s * (1.5 / 10)}
        ry={s * (1.5 / 10)}
        fill={outline ? "#FFFFFF" : color}
        stroke={outline ? color : "none"}
        strokeWidth={outline ? strokeW : 0}
      />
    </Svg>
  );
}
