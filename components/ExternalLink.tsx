import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Linking, Platform, Pressable, type PressableProps } from 'react-native';

type ExternalLinkProps = Omit<PressableProps, 'onPress'> & {
  href: string;
  children: React.ReactNode;
};

export function ExternalLink({ href, children, ...props }: ExternalLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      {...props}
      onPress={async () => {
        if (Platform.OS === 'web') {
          await Linking.openURL(href);
          return;
        }
        await WebBrowser.openBrowserAsync(href);
      }}>
      {children}
    </Pressable>
  );
}
