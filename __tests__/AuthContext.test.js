import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Button } from 'react-native';

describe('AuthContext', () => {
  it('initializes with no user and can signup/logout', async () => {
    const TestConsumer = () => {
      const ctx = React.useContext(AuthContext);
      return (
        <div>
          <span data-testid="username">{ctx.user ? ctx.user.username : 'null'}</span>
          <button onClick={() => ctx.signup('testuser', 'pw')}>signup</button>
          <button onClick={() => ctx.logout()}>logout</button>
        </div>
      );
    };

    const { getByTestId, getByText } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

  // initially no user
  await waitFor(() => expect(getByTestId('username').textContent).toBe('null'));

  // signup should create a user
  fireEvent.click(getByText('signup'));
  await waitFor(() => expect(getByTestId('username').textContent).toBe('testuser'));

  // logout should clear
  fireEvent.click(getByText('logout'));
  await waitFor(() => expect(getByTestId('username').textContent).toBe('null'));
  });
});
