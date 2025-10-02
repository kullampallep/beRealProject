import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import BeRealCard from '../../components/BeRealCard';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [userPhotos, setUserPhotos] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    thisWeek: 0,
    streak: 3 // Simulated streak
  });

  useEffect(() => {
    loadUserPhotos();
  }, [user]);

  const loadUserPhotos = async () => {
    try {
      const raw = await AsyncStorage.getItem('photos');
      const allPhotos = raw ? JSON.parse(raw) : [];
      
      // Filter photos by current user
      const myPhotos = allPhotos.filter(photo => 
        photo.user && photo.user.username === user?.username
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setUserPhotos(myPhotos);

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisWeekPosts = myPhotos.filter(photo => 
        new Date(photo.createdAt) >= weekAgo
      );

      setStats({
        totalPosts: myPhotos.length,
        thisWeek: thisWeekPosts.length,
        streak: Math.min(myPhotos.length, 7) // Simple streak calculation
      });
    } catch (e) {
      console.error('Error loading user photos', e);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(tabs)/auth');
          }
        }
      ]
    );
  };

  const getJoinDate = () => {
    // Simulate join date based on user creation
    const joinDate = new Date();
    joinDate.setDate(joinDate.getDate() - Math.floor(Math.random() * 30));
    return joinDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getMembershipDuration = () => {
    const days = Math.floor(Math.random() * 30) + 1;
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return '1 week';
    if (weeks < 4) return `${weeks} weeks`;
    return '1 month';
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view your profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusEmoji}>✨</Text>
            </View>
          </View>
          
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.joinDate}>Joined {getJoinDate()}</Text>
          <Text style={styles.membershipDuration}>BeReal for {getMembershipDuration()}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalPosts}</Text>
            <Text style={styles.statLabel}>BeReals</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/take-photo')}
          >
            <Text style={styles.actionEmoji}>📸</Text>
            <Text style={styles.actionText}>Take BeReal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/friends')}
          >
            <Text style={styles.actionEmoji}>👥</Text>
            <Text style={styles.actionText}>Friends</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.actionEmoji}>🌍</Text>
            <Text style={styles.actionText}>Explore</Text>
          </TouchableOpacity>
        </View>

        {/* My BeReals */}
        <View style={styles.myBeRealsSection}>
          <Text style={styles.sectionTitle}>My BeReals</Text>
          {userPhotos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>📸</Text>
              <Text style={styles.emptyStateText}>No BeReals yet</Text>
              <Text style={styles.emptyStateSubtext}>Share your first authentic moment!</Text>
              <TouchableOpacity 
                style={styles.createFirstButton}
                onPress={() => router.push('/take-photo')}
              >
                <Text style={styles.createFirstButtonText}>Create First BeReal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photosGrid}>
              {userPhotos.map((photo) => (
                <BeRealCard key={photo.id} item={photo} />
              ))}
            </View>
          )}
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appInfoTitle}>BeReal.</Text>
          <Text style={styles.appInfoSubtitle}>Your daily dose of real life</Text>
          <Text style={styles.appInfoDescription}>
            😊 Meaningful connections{'\n'}
            ⚠️ Spontaneous moments{'\n'}
            🤳 Authentic real life
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  logoutButton: {
    fontSize: 20,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  statusEmoji: {
    fontSize: 14,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  membershipDuration: {
    fontSize: 12,
    color: '#666',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 20,
    backgroundColor: '#111',
    borderRadius: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: 80,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  myBeRealsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createFirstButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  photosGrid: {
    gap: 20,
  },
  appInfoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 20,
  },
  appInfoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  appInfoSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 16,
  },
  appInfoDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});

export default ProfileScreen;
