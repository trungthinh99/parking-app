import Svg, { Circle } from "react-native-svg";

// Required field dot indicator
export function RequiredDot() {
  return (
    <Svg width={8} height={8} viewBox="0 0 8 8">
      <Circle cx={4} cy={4} r={4} fill="#FF3337" />
    </Svg>
  );
}
