import { memo } from "react";
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";
import {
  SCROLLABLE_TYPE,
  createBottomSheetScrollableComponent,
  type BottomSheetScrollViewMethods,
} from "@gorhom/bottom-sheet";
import type { BottomSheetScrollViewProps } from "@gorhom/bottom-sheet/src/components/bottomSheetScrollable/types";
import Reanimated from "react-native-reanimated";

// Wrap KeyboardAwareScrollView with bottom-sheet HOC for keyboard-aware scrolling inside BottomSheet
const AnimatedScrollView =
  Reanimated.createAnimatedComponent<KeyboardAwareScrollViewProps>(KeyboardAwareScrollView);

const BottomSheetScrollViewComponent = createBottomSheetScrollableComponent<
  BottomSheetScrollViewMethods,
  BottomSheetScrollViewProps
>(SCROLLABLE_TYPE.SCROLLVIEW, AnimatedScrollView);

const BottomSheetKeyboardAwareScrollView = memo(BottomSheetScrollViewComponent);
BottomSheetKeyboardAwareScrollView.displayName = "BottomSheetKeyboardAwareScrollView";

export default BottomSheetKeyboardAwareScrollView;
