import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('AuthContext', () => {
  it('initializes with no user and can signup/logout', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => React.useContext(AuthContext), { wrapper });
    // Initially loading defined
    expect(result.current.loading).toBeDefined();
    // Use signup (username, password)
    await act(async () => {
      const res = await result.current.signup('testuser', 'pw');
      expect(res.success).toBe(true);
    });
    expect(result.current.user).toBeTruthy();
    expect(result.current.user.username).toBe('testuser');
    // logout
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.user).toBeNull();
  });
});
