/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import { Text as DefaultText, View as DefaultView, TextStyle, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

type FontWeight = TextStyle['fontWeight'];

const FONT_WEIGHT_MAP: Record<NonNullable<FontWeight>, string> = {
  '100': 'Pretendard-Thin',
  '200': 'Pretendard-ExtraLight',
  '300': 'Pretendard-Light',
  '400': 'Pretendard-Regular',
  '500': 'Pretendard-Medium',
  '600': 'Pretendard-SemiBold',
  '700': 'Pretendard-Bold',
  '800': 'Pretendard-ExtraBold',
  '900': 'Pretendard-Black',
  normal: 'Pretendard-Regular',
  bold: 'Pretendard-Bold',
  ultralight: 'Pretendard-Thin',
  thin: 'Pretendard-Thin',
  light: 'Pretendard-Light',
  medium: 'Pretendard-Medium',
  regular: 'Pretendard-Regular',
  semibold: 'Pretendard-SemiBold',
  condensedBold: 'Pretendard-Bold',
  condensed: 'Pretendard-Regular',
  heavy: 'Pretendard-ExtraBold',
  black: 'Pretendard-Black',
};

function getFontFamily(fontWeight?: FontWeight): string {
  if (!fontWeight) return 'Pretendard-Regular';
  return FONT_WEIGHT_MAP[fontWeight] || 'Pretendard-Regular';
}

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const flatStyle = StyleSheet.flatten(style) || {};
  const fontFamily = getFontFamily(flatStyle.fontWeight);

  return <DefaultText style={[{ color, fontFamily }, style, { fontFamily }]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
