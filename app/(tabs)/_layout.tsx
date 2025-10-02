import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="feed" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="friends" />
    </Stack>
  );
}