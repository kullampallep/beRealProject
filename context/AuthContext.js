import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if the user is already logged in
    const checkUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        // done initializing
        setLoading(false);
      } catch (error) {
        console.error("Error reading user from async storage", error);
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (username, password) => {
    try {
      const stored = await AsyncStorage.getItem('users');
      const users = stored ? JSON.parse(stored) : [];
      const foundUser = users.find(u => u.username === username && u.password === password);
      if (foundUser) {
        setUser(foundUser);
        await AsyncStorage.setItem('user', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error logging in", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  const signup = async (username, password) => {
    try {
      const stored = await AsyncStorage.getItem('users');
      const users = stored ? JSON.parse(stored) : [];
      const existingUser = users.find(u => u.username === username);
      if (existingUser) {
        return { success: false, message: 'Username already exists' };
      }
      const newUser = { username, password };
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      return { success: true };
    } catch (error) {
      console.error("Error signing up", error);
      return { success: false, message: 'An error occurred' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};
