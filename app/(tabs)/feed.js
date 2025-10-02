import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, Dimensions, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { FriendsContext } from '../../context/FriendsContext';
import { useRouter } from 'expo-router';
import BeRealCard from '../../components/BeRealCard';

const { width } = Dimensions.get('window');

const isToday = (iso) => {
  try {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString();
  } catch (e) {
    return false;
  }
};


const FeedScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const { friends, friendRequests } = useContext(FriendsContext);
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPhotos = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('photos');
      const arr = raw ? JSON.parse(raw) : [];
      
      // Get list of friend usernames
      const friendUsernames = friends.map(friend => friend.username);
      
      // Filter to show: own posts + friends' posts + today only
      const todays = arr.filter((p) => {
        const isTodayPost = isToday(p.createdAt);
        const isOwnPost = p.user?.username === user?.username;
        const isFriendPost = friendUsernames.includes(p.user?.username);
        
        return isTodayPost && (isOwnPost || isFriendPost);
      }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      
      setPhotos(todays);
    } catch (e) {
      console.error('Error loading photos', e);
      setPhotos([]);
    }
  }, [friends, user]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  }, [loadPhotos]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)/auth');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>BeReal.</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>{user?.username?.charAt(0)?.toUpperCase() || '?'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.feedHeader}>
        <View style={styles.feedTitleContainer}>
          <Text style={styles.feedTitle}>My Friends</Text>
          {friendRequests.length > 0 && (
            <TouchableOpacity 
              style={styles.requestsBadge}
              onPress={() => router.push('/(tabs)/friends')}
            >
              <Text style={styles.requestsBadgeText}>{friendRequests.length}</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.feedSubtitle}>
          {photos.length} BeReal{photos.length !== 1 ? 's' : ''} today
          {friends.length > 0 && ` • ${friends.length} friend${friends.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>📸</Text>
          <Text style={styles.emptyText}>
            {friends.length === 0 
              ? 'No friends to see BeReals from' 
              : 'No BeReals yet today'
            }
          </Text>
          <Text style={styles.emptySubtext}>
            {friends.length === 0
              ? 'Add friends to see their authentic moments!'
              : 'Be the first to share an authentic moment!'
            }
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity 
              style={styles.takePhotoButton}
              onPress={() => router.push('/take-photo')}
            >
              <Text style={styles.takePhotoText}>Take a BeReal</Text>
            </TouchableOpacity>
            {friends.length === 0 && (
              <TouchableOpacity 
                style={styles.findFriendsButton}
                onPress={() => router.push('/(tabs)/friends')}
              >
                <Text style={styles.findFriendsText}>Find Friends</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => <BeRealCard item={item} />}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={['#fff']}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
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
  title: { 
    fontSize: 20, 
    fontWeight: '800',
    color: '#fff',
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  feedHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  feedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  requestsBadge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 12,
  },
  requestsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  feedSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  empty: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 48,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  takePhotoButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  takePhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  findFriendsButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  findFriendsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FeedScreen;
