import React, { useContext, useEffect } from 'react';
import { useRouter, useSegments, Slot } from 'expo-router';
import { AuthContext, AuthProvider } from '../context/AuthContext';

const InitialLayout = () => {
  const { user, loading } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inTabsGroup = segments[0] === '(tabs)';

    // don't navigate until loading completes
    if (loading) return;

    console.log('InitialLayout effect', { user: !!user, segments, loading, inTabsGroup });

    // Only perform redirects from the bare root (no segments).
    // This prevents the layout from immediately clobbering navigation
    // to non-root routes such as /take-photo which are outside the
    // (tabs) group.
  if (user && !inTabsGroup && segments[0] === undefined) {
      // Route logged-in users to the app home (index) where the "Time to BeReal" button lives
      router.replace('/');
    } else if (!user && !inTabsGroup) {
      // If not logged in and not already inside the tabs group, send to auth
      router.replace('/(tabs)/auth');
    }
  }, [user, segments, loading, router]);

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
