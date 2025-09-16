import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
      console.log('API Response:', response.data); // Ghi log để debug
      const sortedNotifications = response.data
        .filter(item => item.timestamp) // Lọc bỏ thông báo không có timestamp
        .sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));
      setNotifications(sortedNotifications);
      setLoading(false);
      setRefreshing(false);
      await AsyncStorage.setItem('notifications', JSON.stringify(sortedNotifications));
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
          const parsed = JSON.parse(stored).filter(item => item.timestamp);
          console.log('Stored notifications:', parsed); // Ghi log để debug
          setNotifications(parsed.sort((a, b) =>
            moment(b.timestamp).diff(moment(a.timestamp))
          ));
        }
      } catch (err) {
        console.error('Lỗi khi load từ AsyncStorage:', err);
      }
      await fetchUserId();
      await fetchNotifications();
    };
    loadLocalNotifications();
  }, []);

  // WebSocket listeners
  const topicInit = lessorId ? topics.lessor.pendingContract(lessorId) : null;
  const topicActive = lessorId ? topics.lessor.activeContract(lessorId) : null;
  const topicReject = lessorId ? topics.lessor.rejectContract(lessorId) : null;
  const topicCreateRental = lessorId ? topics.lessor.createRental(lessorId) : null;

  const { messages: messagesInit } = useWebSocket(topicInit);
  const { messages: messagesActive } = useWebSocket(topicActive);
  const { messages: messagesReject } = useWebSocket(topicReject);
  const { messages: messagesCreateRental } = useWebSocket(topicCreateRental);

  useEffect(() => {
    if (messagesInit?.length > 0 || messagesActive?.length > 0 ||
        messagesReject?.length > 0 || messagesCreateRental?.length > 0) {
      fetchNotifications();
    }
  }, [messagesInit, messagesActive, messagesReject, messagesCreateRental]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const getRelativeTime = (dateString) => {
    if (!dateString) {
      console.error('Date string is undefined or null');
      return 'Vừa xong';
    }
    // Hỗ trợ nhiều định dạng thời gian, bao gồm ISO 8601
    const parsedDate = moment(dateString, [
      'YYYY-MM-DD HH:mm:ss.SSSSSS',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DDTHH:mm:ss.SSSSSS',
      moment.ISO_8601
    ], true);
    if (!parsedDate.isValid()) {
      console.error('Invalid date format:', dateString);
      return 'Vừa xong';
    }
    return parsedDate.fromNow();
  };

  const renderItem = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(500)}
      style={styles.itemContainer}
    >
      <TouchableOpacity style={styles.itemContent} activeOpacity={0.8}>
        <View style={styles.iconContainer}>
          <Icon name="notifications" size={24} color="#4CAF50" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.createdAt}>{getRelativeTime(item.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="notifications-off" size={64} color="#6B7280" />
      <Text style={styles.emptyText}>Không có thông báo nào</Text>
      <Text style={styles.emptySubText}>Kéo xuống để làm mới</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.header}>
        <Text style={styles.title}>Thông Báo</Text>
      </LinearGradient>
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />
        }
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  itemContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 4,
  },
  createdAt: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});

export default NotificationsScreen;