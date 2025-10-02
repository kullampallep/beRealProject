import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Image, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

const isToday = (iso) => {
  try {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString();
  } catch (e) {
    return false;
  }
};

const PhotoItem = ({ item }) => {
  return (
    <View style={styles.photoItem}>
      {item.front ? <Image source={{ uri: item.front }} style={styles.thumb} /> : null}
      {item.back ? <Image source={{ uri: item.back }} style={styles.thumb} /> : null}
      <View style={{ flex: 1, paddingLeft: 8 }}>
        <Text style={styles.username}>{item.user?.username ?? 'unknown'}</Text>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
      </View>
    </View>
  );
};

const FeedScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPhotos = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('photos');
      const arr = raw ? JSON.parse(raw) : [];
      // only today's photos
      const todays = arr.filter((p) => isToday(p.createdAt)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setPhotos(todays);
    } catch (e) {
      console.error('Error loading photos', e);
      setPhotos([]);
    }
  }, []);

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
      <View style={styles.header}>
        <Text style={styles.title}>BeReal — Today's Photos</Text>
        {user && <Text style={styles.welcome}>Hello, {user.username}</Text>}
      </View>

      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Text>No BeReals for today yet.</Text>
          <Text style={{ color: 'gray', marginTop: 8 }}>Take a BeReal to show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => <PhotoItem item={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <View style={{ padding: 12 }}>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
  welcome: { marginTop: 6, color: 'gray' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoItem: { flexDirection: 'row', padding: 12, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  thumb: { width: 120, height: 90, borderRadius: 8, backgroundColor: '#000', marginRight: 8 },
  username: { fontWeight: '600' },
  time: { color: 'gray', marginTop: 4 },
});

export default FeedScreen;
