import React from "react";
import { StyleSheet, View } from "react-native";

export function DragHandle() {
  return (
    <View style={styles.handleContainer}>
      <View style={styles.handle} />
    </View>
  );
}

const styles = StyleSheet.create({
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 50,
    height: 6,
    borderRadius: 100,
    backgroundColor: "#E9E9E9",
  },
});
