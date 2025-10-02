import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const AuthScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup } = useContext(AuthContext);
  const router = useRouter();

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isLogin) {
      const success = await login(username.trim(), password);
      if (success) {
        router.replace('/');
      } else {
        Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
      }
    } else {
      const { success, message } = await signup(username.trim(), password);
      if (success) {
        router.replace('/');
      } else {
        Alert.alert('Signup Failed', message || 'An error occurred');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>BeReal.</Text>
        <Text style={styles.subtitle}>Your daily dose of real life</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>{isLogin ? 'Welcome back' : 'Join BeReal'}</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
          <Text style={styles.primaryButtonText}>
            {isLogin ? 'Log In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          😊 Meaningful connections{'\n'}
          ⚠️ Spontaneous moments{'\n'}
          🤳 Authentic real life
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchText: {
    fontSize: 14,
    color: '#ccc',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default AuthScreen;
