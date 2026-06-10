import { useEffect, useRef } from "react";
import { Animated, Easing, Image } from "react-native";

interface LoadingSpinnerProps {
  size?: number;
}

export function LoadingSpinner({ size = 50 }: LoadingSpinnerProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => spin());
    };
    spin();
  }, []);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Image
        source={require("../assets/images/loading.png")}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}
