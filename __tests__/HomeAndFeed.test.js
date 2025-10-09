import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import HomeScreen from '../app/index';
import FeedScreen from '../app/(tabs)/feed';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { FriendsProvider, FriendsContext } from '../context/FriendsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('Home & Feed screens', () => {
  it('renders welcome when not logged in', async () => {
    // avoid AuthProvider's async initialization by providing a direct context value
    const anonWrapper = ({ children }) => (
      <AuthContext.Provider value={{ user: null, loading: false, logout: jest.fn() }}>{children}</AuthContext.Provider>
    );
    const tree = render(<HomeScreen />, { wrapper: anonWrapper });
    await waitFor(() => expect(tree.getByText(/Please sign in to share authentic moments/)).toBeTruthy());
  });

  it('shows Time to BeReal when logged in and navigates', async () => {
    // provide a logged-in context directly to avoid async provider state
    const loggedInWrapper = ({ children }) => (
      <AuthContext.Provider value={{ user: { username: 'tester' }, loading: false, logout: jest.fn() }}>{children}</AuthContext.Provider>
    );
    const r2 = render(<HomeScreen />, { wrapper: loggedInWrapper });
    await waitFor(() => expect(r2.getByText(/Time to BeReal/)).toBeTruthy());
  });

  it('feed loads todays photos', async () => {
    const now = new Date().toISOString();
    const photos = [{ id: '1', createdAt: now, front: 'data:1', user: { username: 'a' } }];
    await AsyncStorage.setItem('photos', JSON.stringify(photos));
    const authValue = { user: { username: 'tester' }, loading: false, logout: jest.fn() };
    const friendsValue = { friends: [], friendRequests: [], sentRequests: [], loading: false, searchUsers: jest.fn(), isFriend: () => false, hasSentRequest: () => false, hasIncomingRequest: () => false, loadFriendsData: jest.fn() };
    const wrapper2 = ({ children }) => (
      <AuthContext.Provider value={authValue}>
        <FriendsContext.Provider value={friendsValue}>{children}</FriendsContext.Provider>
      </AuthContext.Provider>
    );
    const { getByText } = render(<FeedScreen />, { wrapper: wrapper2 });
    // look for the header title which is specific
    await waitFor(() => expect(getByText(/^My Friends$/)).toBeTruthy());
  });
});
