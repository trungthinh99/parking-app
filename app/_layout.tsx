import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as Location from "expo-location";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import "react-native-reanimated";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { LogBox } from "react-native";
import { useNetworkActivityDevTools } from "@rozenite/network-activity-plugin";
import { useColorScheme } from "@/components/useColorScheme";

// Suppress known Reanimated v4 + @gorhom/bottom-sheet v5 compatibility warning.
// The library internally modifies animated ref .current after worklet serialization.
// Tracked upstream — safe to ignore until bottom-sheet releases a fix.
LogBox.ignoreLogs(["[Worklets] Tried to modify key"]);
import { AppModalProvider } from "@/src/components/AppModalProvider";
import { AppToastProvider } from "@/src/components/AppToastProvider";
import { AppQueryProvider } from "@/src/query/query-provider";
import { useAuthStore } from "@/src/store/auth-store";
import { useNotificationStore } from "@/src/store/notification-store";
import { onAuthExpired } from "@/src/lib/auth-event";
import {
  configureNotificationHandler,
  requestNotificationPermission,
} from "@/src/lib/notification";
import { PATHS } from "@/constants/Paths";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Use index as initial route so it can check auth state and redirect accordingly
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Pretendard-Thin": require("../assets/fonts/Pretendard-Thin.otf"),
    "Pretendard-ExtraLight": require("../assets/fonts/Pretendard-ExtraLight.otf"),
    "Pretendard-Light": require("../assets/fonts/Pretendard-Light.otf"),
    "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.otf"),
    "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.otf"),
    "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.otf"),
    "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.otf"),
    "Pretendard-ExtraBold": require("../assets/fonts/Pretendard-ExtraBold.otf"),
    "Pretendard-Black": require("../assets/fonts/Pretendard-Black.otf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Show custom splash screen while fonts are loading
  if (!loaded) {
    return (
      <View style={splashStyles.container}>
        <Image
          source={require("../src/assets/images/logo-parking.png")}
          style={splashStyles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return <RootLayoutNav />;
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#238AAF",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
  },
});

function RootLayoutNav() {
  useNetworkActivityDevTools();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrateNotification = useNotificationStore((s) => s.hydrate);

  // Hydrate auth + notification stores from SecureStore on app start
  useEffect(() => {
    hydrate();
    hydrateNotification();
    configureNotificationHandler();
  }, [hydrate, hydrateNotification]);

  // Request location & notification permissions on app start
  useEffect(() => {
    Location.requestForegroundPermissionsAsync();
    requestNotificationPermission();
  }, []);

  // Redirect to login when tokens expire (emitted by API client)
  useEffect(() => {
    return onAuthExpired(() => {
      // Clear Zustand auth state alongside the existing token cleanup
      useAuthStore.getState().logout();
      router.replace(PATHS.AUTH.LOGIN);
    });
  }, [router]);

  // Deep-link: route /receive-invite?code=... to the invite acceptance screen,
  // both when the app is cold-started via the link and while it's already running.
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      let parsed: ReturnType<typeof Linking.parse>;
      try {
        parsed = Linking.parse(url);
      } catch {
        return;
      }
      const path = parsed.path ?? "";
      // Match short form `/i/<code>` or legacy `/receive-invite?code=...`/`?token=...`
      let code: string | undefined;
      const shortMatch = path.match(/(?:^|\/)i\/([^/?#]+)/);
      if (shortMatch) {
        code = shortMatch[1];
      } else if (path.includes("receive-invite")) {
        const query = (parsed.queryParams ?? {}) as Record<string, string | string[] | undefined>;
        const raw = query.code ?? query.token;
        code = Array.isArray(raw) ? raw[0] : raw;
      } else {
        return;
      }

      // Always open the shared accept/reject screen. The screen itself branches
      // on accept by auth state: logged-in → add region (TBL_SURVEYOR_REGIONS)
      // and stay in the app; not logged in → continue to signup.
      router.push({
        pathname: PATHS.AUTH.RECEIVE_INVITE as never,
        params: code ? { code } : undefined,
      });
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [router]);

  // Keep splash visible until auth state is loaded from SecureStore.
  // This prevents the router from navigating to login before we know
  // whether the user already has a valid token.
  if (!isHydrated) {
    return (
      <View style={splashStyles.container}>
        <Image
          source={require("../src/assets/images/logo-parking.png")}
          style={splashStyles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <AppQueryProvider>
            <AppToastProvider>
              <AppModalProvider>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="messages"
                    options={{
                      headerShown: false,
                      animation: "slide_from_right",
                    }}
                  />
                  <Stack.Screen
                    name="on-street-survey-zone"
                    options={{
                      headerShown: false,
                      animation: "slide_from_right",
                    }}
                  />
                  <Stack.Screen
                    name="off-street-survey-zone"
                    options={{
                      headerShown: false,
                      animation: "slide_from_right",
                    }}
                  />
                  <Stack.Screen
                    name="private-survey-zone"
                    options={{
                      headerShown: false,
                      animation: "slide_from_right",
                    }}
                  />
                  <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                </Stack>
              </AppModalProvider>
            </AppToastProvider>
          </AppQueryProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
