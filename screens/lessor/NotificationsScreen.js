import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/vi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { getAuthApi } from '../../utils/useAuthApi';
import { endpoints } from '../../configs/APIs';
import { useWebSocket } from '../../utils/useWebSocket';
import { topics } from '../../utils/topics';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lessorId, setLessorId] = useState(null);

  // Đặt locale tiếng Việt cho moment
  moment.locale('vi');

  // Lấy lessorId từ token
  const fetchUserId = async () => {
    try {
      const token = await AsyncStorage.getItem('access-token');
      if (token) {
        const decoded = jwtDecode(token);
        setLessorId(decoded.userId);
      } else {
        setError('Không tìm thấy token');
      }
    } catch (err) {
      setError('Lỗi khi giải mã token: ' + err.message);
    }
  };

  // Fetch thông báo từ API
  const fetchNotifications = async () => {
    try {
      const api = await getAuthApi();
      const response = await api.get(endpoints['notifications']);
      setNotifications(response.data);
      setLoading(false);
      setRefreshing(false);
      await AsyncStorage.setItem('notifications', JSON.stringify(response.data));
    } catch (err) {
      setError('Lỗi khi tải thông báo: ' + err.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load từ AsyncStorage và fetch khi mount
  useEffect(() => {
    const loadLocalNotifications = async () => {
      try {
        const stored = await AsyncStorage.getItem('notifications');
        if (stored) {
          setNotifications(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Lỗi khi load từ AsyncStorage:', err);
      }
      await fetchUserId();
      await fetchNotifications();
    };
    loadLocalNotifications();
  }, []);

  // Memoize topic để tránh thay đổi không cần thiết
  // const memoizedTopic = useMemo(() => {
  //   const lessorId = null;
  //   lessorId? topics.lessor.pendingContract(lessorId) : null;
  // }, [lessorId]);

  // Lắng nghe WebSocket khi có lessorId
  const topic = lessorId ? topics.lessor.pendingContract(lessorId) : null;
  const { messages } = useWebSocket(topic);

  // Cập nhật notifications khi nhận được message từ WebSocket
  useEffect(() => {
    console.log('📬 Messages từ WebSocket:', messages);
    if (messages && messages.length > 0) {
      fetchNotifications();
    }
  }, [messages, lessorId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const getRelativeTime = (dateString) => {
    return moment(dateString).fromNow();
  };

  const renderItem = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(500)}
      style={styles.itemContainer}
    >
      <TouchableOpacity style={styles.itemContent}>
        <View style={styles.iconContainer}>
          <Icon name="notifications" size={24} color="#007AFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.createdAt}>{getRelativeTime(item.created_at)}</Text>
          <Text style={styles.userId}>User ID: {item.user_id}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="notifications-off" size={64} color="#999" />
      <Text style={styles.emptyText}>Không có thông báo nào</Text>
      <Text style={styles.emptySubText}>Kéo xuống để làm mới</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient colors={['#4B79A1', '#283E51']} style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient colors={['#4B79A1', '#283E51']} style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4B79A1', '#283E51']} style={styles.container}>
        <Text style={styles.title}>Thông Báo</Text>
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F0FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  createdAt: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  userId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B6B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});

export default NotificationsScreen;