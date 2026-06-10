import { TextStyle } from "react-native";

/**
 * Typography design system for mobile app.
 *
 * | Variant   | Size | Weight   | Line Height | Letter Spacing |
 * |-----------|------|----------|-------------|----------------|
 * | heading1  | 30px | SemiBold | 140%        | -2.2%          |
 * | heading2  | 24px | SemiBold | 140%        | -2.2%          |
 * | heading3  | 18px | SemiBold | 140%        | -2.2%          |
 * | body1     | 14px | SemiBold | 140%        | -2.2%          |
 * | body2     | 14px | Medium   | 140%        | -2.2%          |
 * | body3     | 14px | Regular  | 140%        | -2.2%          |
 * | detail    | 12px | Regular  | 140%        | -2.2%          |
 */

export type TypographyVariant =
  | "heading1"
  | "heading2"
  | "heading3"
  | "body1"
  | "body2"
  | "body3"
  | "detail";

// Letter spacing: -2.2% of font size
function letterSpacing(fontSize: number): number {
  return fontSize * -0.022;
}

export const typography: Record<TypographyVariant, TextStyle> = {
  heading1: {
    fontSize: 30,
    fontWeight: "600",
    lineHeight: 30 * 1.4, // 42
    letterSpacing: letterSpacing(30), // -0.66
  },
  heading2: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 24 * 1.4, // 33.6
    letterSpacing: letterSpacing(24), // -0.528
  },
  heading3: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 18 * 1.4, // 25.2
    letterSpacing: letterSpacing(18), // -0.396
  },
  body1: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 14 * 1.4, // 19.6
    letterSpacing: letterSpacing(14), // -0.308
  },
  body2: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 14 * 1.4, // 19.6
    letterSpacing: letterSpacing(14), // -0.308
  },
  body3: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 14 * 1.4, // 19.6
    letterSpacing: letterSpacing(14), // -0.308
  },
  detail: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 12 * 1.4, // 16.8
    letterSpacing: letterSpacing(12), // -0.264
  },
};
