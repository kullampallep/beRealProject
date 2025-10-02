import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';

export const FriendsContext = createContext();

export const FriendsProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFriendsData();
    } else {
      // Clear data when user logs out
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
    }
  }, [user]);

  const loadFriendsData = async () => {
    try {
      setLoading(true);
      
      // Load friends
      const friendsData = await AsyncStorage.getItem(`friends_${user.username}`);
      const userFriends = friendsData ? JSON.parse(friendsData) : [];
      setFriends(userFriends);

      // Load incoming friend requests
      const requestsData = await AsyncStorage.getItem(`friend_requests_${user.username}`);
      const incomingRequests = requestsData ? JSON.parse(requestsData) : [];
      setFriendRequests(incomingRequests);

      // Load sent friend requests
      const sentData = await AsyncStorage.getItem(`sent_requests_${user.username}`);
      const outgoingRequests = sentData ? JSON.parse(sentData) : [];
      setSentRequests(outgoingRequests);
    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (targetUsername) => {
    try {
      if (!user || targetUsername === user.username) {
        return { success: false, message: 'Invalid request' };
      }

      // Check if already friends
      if (friends.some(friend => friend.username === targetUsername)) {
        return { success: false, message: 'Already friends with this user' };
      }

      // Check if request already sent
      if (sentRequests.some(req => req.username === targetUsername)) {
        return { success: false, message: 'Friend request already sent' };
      }

      // Check if user exists
      const usersData = await AsyncStorage.getItem('users');
      const allUsers = usersData ? JSON.parse(usersData) : [];
      const targetUser = allUsers.find(u => u.username === targetUsername);
      
      if (!targetUser) {
        return { success: false, message: 'User not found' };
      }

      // Add to sent requests
      const newSentRequest = {
        username: targetUsername,
        sentAt: new Date().toISOString(),
        status: 'pending'
      };
      const updatedSentRequests = [...sentRequests, newSentRequest];
      setSentRequests(updatedSentRequests);
      await AsyncStorage.setItem(`sent_requests_${user.username}`, JSON.stringify(updatedSentRequests));

      // Add to target user's incoming requests
      const targetRequestsData = await AsyncStorage.getItem(`friend_requests_${targetUsername}`);
      const targetRequests = targetRequestsData ? JSON.parse(targetRequestsData) : [];
      const newIncomingRequest = {
        username: user.username,
        sentAt: new Date().toISOString(),
        status: 'pending'
      };
      const updatedTargetRequests = [...targetRequests, newIncomingRequest];
      await AsyncStorage.setItem(`friend_requests_${targetUsername}`, JSON.stringify(updatedTargetRequests));

      return { success: true, message: 'Friend request sent!' };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, message: 'Error sending request' };
    }
  };

  const acceptFriendRequest = async (fromUsername) => {
    try {
      // Add to both users' friend lists
      const newFriend = {
        username: fromUsername,
        addedAt: new Date().toISOString()
      };
      
      // Add to current user's friends
      const updatedFriends = [...friends, newFriend];
      setFriends(updatedFriends);
      await AsyncStorage.setItem(`friends_${user.username}`, JSON.stringify(updatedFriends));

      // Add current user to sender's friends
      const senderFriendsData = await AsyncStorage.getItem(`friends_${fromUsername}`);
      const senderFriends = senderFriendsData ? JSON.parse(senderFriendsData) : [];
      const updatedSenderFriends = [...senderFriends, { username: user.username, addedAt: new Date().toISOString() }];
      await AsyncStorage.setItem(`friends_${fromUsername}`, JSON.stringify(updatedSenderFriends));

      // Remove from incoming requests
      const updatedRequests = friendRequests.filter(req => req.username !== fromUsername);
      setFriendRequests(updatedRequests);
      await AsyncStorage.setItem(`friend_requests_${user.username}`, JSON.stringify(updatedRequests));

      // Remove from sender's sent requests
      const senderSentData = await AsyncStorage.getItem(`sent_requests_${fromUsername}`);
      const senderSentRequests = senderSentData ? JSON.parse(senderSentData) : [];
      const updatedSenderSent = senderSentRequests.filter(req => req.username !== user.username);
      await AsyncStorage.setItem(`sent_requests_${fromUsername}`, JSON.stringify(updatedSenderSent));

      return { success: true, message: 'Friend request accepted!' };
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return { success: false, message: 'Error accepting request' };
    }
  };

  const rejectFriendRequest = async (fromUsername) => {
    try {
      // Remove from incoming requests
      const updatedRequests = friendRequests.filter(req => req.username !== fromUsername);
      setFriendRequests(updatedRequests);
      await AsyncStorage.setItem(`friend_requests_${user.username}`, JSON.stringify(updatedRequests));

      // Update sender's sent requests status
      const senderSentData = await AsyncStorage.getItem(`sent_requests_${fromUsername}`);
      const senderSentRequests = senderSentData ? JSON.parse(senderSentData) : [];
      const updatedSenderSent = senderSentRequests.map(req => 
        req.username === user.username ? { ...req, status: 'rejected' } : req
      );
      await AsyncStorage.setItem(`sent_requests_${fromUsername}`, JSON.stringify(updatedSenderSent));

      return { success: true, message: 'Friend request rejected' };
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return { success: false, message: 'Error rejecting request' };
    }
  };

  const removeFriend = async (friendUsername) => {
    try {
      // Remove from current user's friends
      const updatedFriends = friends.filter(friend => friend.username !== friendUsername);
      setFriends(updatedFriends);
      await AsyncStorage.setItem(`friends_${user.username}`, JSON.stringify(updatedFriends));

      // Remove current user from friend's list
      const friendFriendsData = await AsyncStorage.getItem(`friends_${friendUsername}`);
      const friendFriends = friendFriendsData ? JSON.parse(friendFriendsData) : [];
      const updatedFriendFriends = friendFriends.filter(friend => friend.username !== user.username);
      await AsyncStorage.setItem(`friends_${friendUsername}`, JSON.stringify(updatedFriendFriends));

      return { success: true, message: 'Friend removed' };
    } catch (error) {
      console.error('Error removing friend:', error);
      return { success: false, message: 'Error removing friend' };
    }
  };

  const searchUsers = async (searchTerm) => {
    try {
      const usersData = await AsyncStorage.getItem('users');
      const allUsers = usersData ? JSON.parse(usersData) : [];
      
      return allUsers
        .filter(u => 
          u.username.toLowerCase().includes(searchTerm.toLowerCase()) && 
          u.username !== user?.username
        )
        .map(u => ({ username: u.username }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const isFriend = (username) => {
    return friends.some(friend => friend.username === username);
  };

  const hasSentRequest = (username) => {
    return sentRequests.some(req => req.username === username && req.status === 'pending');
  };

  const hasIncomingRequest = (username) => {
    return friendRequests.some(req => req.username === username);
  };

  return (
    <FriendsContext.Provider value={{
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
    }}>
      {children}
    </FriendsContext.Provider>
  );
};
