import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BeRealCard from '../../components/BeRealCard';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const router = useRouter();
  const [globalPhotos, setGlobalPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGlobalPhotos();
  }, []);

  const loadGlobalPhotos = async () => {
    try {
      setLoading(true);
      // Load all photos from storage (simulating global feed)
      const raw = await AsyncStorage.getItem('photos');
      const photos = raw ? JSON.parse(raw) : [];
      
      // Add some demo photos to make the explore feed more interesting
      const demoPhotos = [
        {
          id: 'demo1',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          user: { username: 'sarah_k' },
          front: 'https://picsum.photos/400/600?random=1',
          back: 'https://picsum.photos/800/1200?random=2'
        },
        {
          id: 'demo2', 
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          user: { username: 'mike_adventures' },
          front: 'https://picsum.photos/400/600?random=3',
          back: 'https://picsum.photos/800/1200?random=4'
        },
        {
          id: 'demo3',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago  
          user: { username: 'emma_daily' },
          front: 'https://picsum.photos/400/600?random=5',
          back: 'https://picsum.photos/800/1200?random=6'
        }
      ];

      const allPhotos = [...photos, ...demoPhotos].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setGlobalPhotos(allPhotos);
    } catch (e) {
      console.error('Error loading global photos', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subtitle}>Discover BeReals from around the world</Text>
        <Text style={styles.count}>{globalPhotos.length} BeReals today</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading BeReals...</Text>
        </View>
      ) : globalPhotos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>🌍</Text>
          <Text style={styles.emptyText}>No BeReals to explore yet</Text>
          <Text style={styles.emptySubtext}>Check back later for more authentic moments!</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {globalPhotos.map((photo) => (
            <BeRealCard key={photo.id} item={photo} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

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
  headerRight: {
    width: 24,
  },
  subHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 4,
  },
  count: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyContainer: {
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
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
});
