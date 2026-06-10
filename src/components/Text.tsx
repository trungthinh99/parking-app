import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from "react-native";
import { typography, TypographyVariant } from "@/constants/Typography";

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
};

type FontWeight = TextStyle["fontWeight"];

const FONT_WEIGHT_MAP: Record<NonNullable<FontWeight>, string> = {
  "100": "Pretendard-Thin",
  "200": "Pretendard-ExtraLight",
  "300": "Pretendard-Light",
  "400": "Pretendard-Regular",
  "500": "Pretendard-Medium",
  "600": "Pretendard-SemiBold",
  "700": "Pretendard-Bold",
  "800": "Pretendard-ExtraBold",
  "900": "Pretendard-Black",
  normal: "Pretendard-Regular",
  bold: "Pretendard-Bold",
  ultralight: "Pretendard-Thin",
  thin: "Pretendard-Thin",
  light: "Pretendard-Light",
  medium: "Pretendard-Medium",
  regular: "Pretendard-Regular",
  semibold: "Pretendard-SemiBold",
  condensedBold: "Pretendard-Bold",
  condensed: "Pretendard-Regular",
  heavy: "Pretendard-ExtraBold",
  black: "Pretendard-Black",
};

function getFontFamily(fontWeight?: FontWeight): string {
  if (!fontWeight) return "Pretendard-Regular";
  return FONT_WEIGHT_MAP[fontWeight] || "Pretendard-Regular";
}

export function Text(props: TextProps) {
  const { style, variant, ...otherProps } = props;

  const variantStyle = variant ? typography[variant] : undefined;
  const flatStyle = StyleSheet.flatten([variantStyle, style]) || {};
  const fontFamily = getFontFamily(flatStyle.fontWeight);

  return <RNText style={[variantStyle, style, { fontFamily }]} {...otherProps} />;
}
