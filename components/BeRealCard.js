import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const BeRealCard = ({ item, onUserPress }) => {
  const getTimeAgo = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMins > 0) return `${diffMins}m`;
    return 'now';
  };

  const getRandomLocation = () => {
    const locations = [
      'San Francisco, CA',
      'New York, NY', 
      'Los Angeles, CA',
      'Austin, TX',
      'Seattle, WA',
      'Miami, FL',
      'Chicago, IL',
      'Boston, MA'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  };

  return (
    <View style={styles.card}>
      {/* User Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo} 
          onPress={() => onUserPress && onUserPress(item.user)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.user?.username ? item.user.username.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.user?.username ?? 'Unknown'}</Text>
            <Text style={styles.location}>📍 {getRandomLocation()}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.timeAgo}>{getTimeAgo(item.createdAt)}</Text>
      </View>
      
      {/* Photo Container */}
      <View style={styles.photoContainer}>
        {item.back && (
          <View style={styles.mainPhotoContainer}>
            <Image source={{ uri: item.back }} style={styles.mainPhoto} resizeMode="cover" />
            {item.front && (
              <View style={styles.frontPhotoContainer}>
                <Image source={{ uri: item.front }} style={styles.frontPhoto} resizeMode="cover" />
              </View>
            )}
          </View>
        )}
        {!item.back && item.front && (
          <Image source={{ uri: item.front }} style={styles.mainPhoto} resizeMode="cover" />
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionEmoji}>💬</Text>
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionEmoji}>🔄</Text>
          <Text style={styles.actionText}>RealMoji</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionEmoji}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 30,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#999',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  photoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  mainPhotoContainer: {
    position: 'relative',
  },
  mainPhoto: {
    width: width - 40,
    height: (width - 40) * 1.33,
    backgroundColor: '#333',
  },
  frontPhotoContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  frontPhoto: {
    width: 110,
    height: 147,
    backgroundColor: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 8,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
});

export default BeRealCard;
