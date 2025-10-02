import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert,
  RefreshControl,
  Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { FriendsContext } from '../../context/FriendsContext';

const { width } = Dimensions.get('window');

const FriendsScreen = () => {
  const { user } = useContext(AuthContext);
  const {
    friends,
    friendRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    searchUsers,
    isFriend,
    hasSentRequest,
    hasIncomingRequest,
    loadFriendsData
  } = useContext(FriendsContext);

  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('friends'); // friends, requests, search
  const [refreshing, setRefreshing] = useState(false);

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) {
      Alert.alert('Search', 'Please enter at least 2 characters');
      return;
    }

    try {
      const results = await searchUsers(searchTerm.trim());
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      Alert.alert('Error', 'Could not search users');
    }
  };

  const handleSendRequest = async (username) => {
    const result = await sendFriendRequest(username);
    Alert.alert(
      result.success ? 'Success' : 'Error',
      result.message
    );
    
    if (result.success) {
      // Update search results to show new status
      await handleSearch();
    }
  };

  const handleAcceptRequest = async (username) => {
    const result = await acceptFriendRequest(username);
    Alert.alert(
      result.success ? 'Success' : 'Error',
      result.message
    );
  };

  const handleRejectRequest = async (username) => {
    const result = await rejectFriendRequest(username);
    Alert.alert(
      result.success ? 'Success' : 'Error',
      result.message
    );
  };

  const handleRemoveFriend = (username) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeFriend(username);
            Alert.alert(
              result.success ? 'Success' : 'Error',
              result.message
            );
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriendsData();
    setRefreshing(false);
  };

  const getStatusForUser = (username) => {
    if (isFriend(username)) return 'friend';
    if (hasSentRequest(username)) return 'sent';
    if (hasIncomingRequest(username)) return 'incoming';
    return 'none';
  };

  const renderFriendItem = (friend) => (
    <View key={friend.username} style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {friend.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.username}>@{friend.username}</Text>
          <Text style={styles.userSubtext}>
            Friends since {new Date(friend.addedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFriend(friend.username)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRequestItem = (request) => (
    <View key={request.username} style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {request.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.username}>@{request.username}</Text>
          <Text style={styles.userSubtext}>
            Sent {new Date(request.sentAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(request.username)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectRequest(request.username)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchItem = (user) => {
    const status = getStatusForUser(user.username);
    
    return (
      <View key={user.username} style={styles.userItem}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.userSubtext}>
              {status === 'friend' && 'Already friends'}
              {status === 'sent' && 'Request sent'}
              {status === 'incoming' && 'Sent you a request'}
              {status === 'none' && 'Not connected'}
            </Text>
          </View>
        </View>
        {status === 'none' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSendRequest(user.username)}
          >
            <Text style={styles.addButtonText}>Add Friend</Text>
          </TouchableOpacity>
        )}
        {status === 'friend' && (
          <TouchableOpacity
            style={styles.friendButton}
            onPress={() => handleRemoveFriend(user.username)}
          >
            <Text style={styles.friendButtonText}>✓ Friends</Text>
          </TouchableOpacity>
        )}
        {status === 'sent' && (
          <View style={styles.sentButton}>
            <Text style={styles.sentButtonText}>Sent</Text>
          </View>
        )}
        {status === 'incoming' && (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(user.username)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for friends..."
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({friendRequests.length})
          </Text>
          {friendRequests.length > 0 && <View style={styles.badge} />}
        </TouchableOpacity>
        {searchResults.length > 0 && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'search' && styles.activeTab]}
            onPress={() => setActiveTab('search')}
          >
            <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
              Search ({searchResults.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#fff']}
          />
        }
      >
        {activeTab === 'friends' && (
          <View>
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>👥</Text>
                <Text style={styles.emptyStateText}>No friends yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Search for users above to send friend requests!
                </Text>
              </View>
            ) : (
              friends.map(renderFriendItem)
            )}
          </View>
        )}

        {activeTab === 'requests' && (
          <View>
            {friendRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>📨</Text>
                <Text style={styles.emptyStateText}>No friend requests</Text>
                <Text style={styles.emptyStateSubtext}>
                  When someone sends you a friend request, it will appear here.
                </Text>
              </View>
            ) : (
              friendRequests.map(renderRequestItem)
            )}
          </View>
        )}

        {activeTab === 'search' && (
          <View>
            {searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>🔍</Text>
                <Text style={styles.emptyStateText}>No users found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try searching for a different username.
                </Text>
              </View>
            ) : (
              searchResults.map(renderSearchItem)
            )}
          </View>
        )}
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
  headerRight: {
    width: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  activeTab: {
    borderBottomColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  content: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userSubtext: {
    fontSize: 12,
    color: '#999',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  friendButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  friendButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  sentButton: {
    backgroundColor: '#666',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FriendsScreen;
