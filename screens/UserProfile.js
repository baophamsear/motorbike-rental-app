import React from "react";
import { View, Text } from "react-native";

export default function UserProfile() {
  console.log("UserProfile loaded");

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome to your profile!</Text>
    </View>
  );
}
