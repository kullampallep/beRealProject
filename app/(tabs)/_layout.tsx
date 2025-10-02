import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="feed" options={{ headerShown: false }} />
    </Stack>
  );
}