import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuthApi } from '../../utils/useAuthApi';
import { endpoints } from '../../configs/APIs';
import { useWebSocket } from '../../utils/useWebSocket';
import jwt_decode from 'jwt-decode';
import { topics } from '../../utils/topics';
import moment from 'moment';
import 'moment/locale/vi';

const DashboardScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rentals, setRentals] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const [lessorId, setLessorId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const navigation = useNavigation();

  // Đặt locale tiếng Việt cho moment
  moment.locale('vi');

  // Hàm lấy lessorId từ token
  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('access-token');
      if (token) {
        const decoded = jwt_decode(token);
        setLessorId(decoded.userId);
      } else {
        throw new Error('Không tìm thấy token');
      }
    } catch (err) {
      console.error('Error fetching user:', err.message);
      setError('Không thể lấy thông tin người dùng');
      setIsLoading(false);
    }
  };

  // Hàm lấy thống kê
  const fetchStats = useCallback(async () => {
    try {
      const api = await getAuthApi();
      if (!api) {
        throw new Error('Không thể khởi tạo API client');
      }
      const response = await api.get(endpoints['getStats']);
      if (response.data) {
        setStats(response.data);
      } else {
        throw new Error('Dữ liệu thống kê không hợp lệ');
      }
    } catch (error) {
      console.error('Error fetching stats:', error.message, error.response?.data);
      setError('Không thể tải dữ liệu thống kê');
      Alert.alert('Lỗi', 'Không thể tải dữ liệu thống kê');
      setStats(null);
    }
  }, []);

  // Gọi fetchUser khi component mount
  useEffect(() => {
    fetchUser();
    fetchStats();
  }, []);

  // WebSocket setup
  const topicCreateRental = lessorId ? topics.lessor.createRental(lessorId) : null;
  const { messages: messagesCreateRental } = useWebSocket(topicCreateRental);

  // Theo dõi WebSocket messages
  useEffect(() => {
    if (messagesCreateRental?.length > 0) {
      console.log('New WebSocket message:', messagesCreateRental);
      fetchRentals(1, filterStatus);
    }
  }, [messagesCreateRental, filterStatus]);

  // Hàm fetch rentals từ API
  const fetchRentals = useCallback(async (page = 1, status = 'all') => {
    setIsLoading(true);
    setError(null);
    try {
      const api = await getAuthApi();
      if (!api) {
        throw new Error('Không thể khởi tạo API client');
      }

      let endpoint;
      switch (status) {
        case 'pending':
          endpoint = endpoints['getPendingRentals'];
          break;
        case 'active':
          endpoint = endpoints['getActiveRentals'];
          break;
        case 'completed':
          endpoint = endpoints['getCompletedRentals'];
          break;
        case 'cancelled':
          endpoint = endpoints['getCancelledRentals'];
          break;
        default:
          endpoint = endpoints['getAllRentals'];
      }

      if (!endpoint) {
        throw new Error(`Endpoint cho trạng thái ${status} không được định nghĩa`);
      }

      console.log(`Fetching rentals: status=${status}, page=${page - 1}, endpoint=${endpoint}`);
      const response = await api.get(endpoint, { params: { page: page - 1, limit: 5 } });
      console.log('API response:', JSON.stringify(response.data, null, 2));

      let rentalData = [];
      let pages = 1;

      if (response.data) {
        if (Array.isArray(response.data.content)) {
          rentalData = response.data.content;
          pages = response.data.totalPages || 1;
        } else if (Array.isArray(response.data)) {
          rentalData = response.data;
          pages = response.data.totalPages || 1;
        } else {
          throw new Error('Dữ liệu API không hợp lệ');
        }
      }

      rentalData = rentalData.map(item => ({
        rentalId: item.rentalId || 'N/A',
        renter: {
          email: item.renter?.email || 'N/A',
          avatarUrl: item.renter?.avatarUrl || null,
        },
        rentalContract: {
          bike: { name: item.rentalContract?.bike?.name || 'N/A' },
          location: { address: item.rentalContract?.location?.address || 'N/A' },
        },
        startDate: item.startDate || null,
        endDate: item.endDate || null,
        status: item.status || 'N/A',
        totalPrice: item.totalPrice || 0,
      }));

      console.log('Processed rentals:', rentalData);
      setRentals(rentalData);
      setTotalPages(pages);
      setCurrentPage(page);
    } catch (error) {
      console.error(`Error fetching ${status} rentals:`, error.message, error.response?.data);
      setError(error.message || 'Không thể tải danh sách đơn thuê xe');
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách đơn thuê xe');
      setRentals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Gọi fetchRentals khi lessorId, currentPage hoặc filterStatus thay đổi
  useEffect(() => {
    if (lessorId) {
      console.log('Fetching rentals with lessorId:', lessorId);
      fetchRentals(currentPage, filterStatus);
    }
  }, [currentPage, filterStatus, lessorId]);

  // Làm mới dữ liệu
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRentals(1, filterStatus);
    setRefreshing(false);
  }, [filterStatus]);

  // Format ngày tháng
  const formatDate = useCallback((dateString) => {
    if (!dateString) {
      console.error('Date string is undefined or null');
      return 'N/A';
    }
    const parsedDate = moment(dateString, [
      'YYYY-MM-DD HH:mm:ss.SSSSSS',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DDTHH:mm:ss.SSSSSS',
      moment.ISO_8601
    ], true);
    if (!parsedDate.isValid()) {
      console.error('Invalid date format:', dateString);
      return 'N/A';
    }
    return parsedDate.format('DD/MM/YYYY');
  }, []);

  // Format trạng thái
  const formatStatus = useCallback((status) => {
    switch (status) {
      case 'pending': return 'Đang chờ';
      case 'active': return 'Đang thuê';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status || 'N/A';
    }
  }, []);

  // Màu trạng thái
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'pending': return '#FFCA28';
      case 'active': return '#4CAF50';
      case 'completed': return '#22C55E';
      case 'cancelled': return '#FF5722';
      default: return '#6B7280';
    }
  }, []);

  // Format tiền tệ
  const formatCurrency = useCallback((value) => {
    return value ? value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : 'N/A';
  }, []);

  // Xử lý hành động nhấn vào đơn thuê
  const handleRentalAction = useCallback((rentalId) => {
    console.log('Navigating to RentalDetail:', rentalId);
    navigation.navigate('RentalDetail', { rentalId });
  }, [navigation]);

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = useCallback((status) => {
    console.log('Changing filter to:', status);
    setFilterStatus(status);
    setCurrentPage(1);
  }, []);

  // Tính toán các trang hiển thị
  const getPaginationRange = useCallback(() => {
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - halfRange);
    let end = Math.min(totalPages, start + maxPagesToShow - 1);
    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  // Render item trong FlatList
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tableRow}
      onPress={() => handleRentalAction(item.rentalId)}
      activeOpacity={0.7}
    >
      <Text style={styles.rowCell} numberOfLines={1} ellipsizeMode="tail">
        {item.rentalContract.bike.name}
      </Text>
      <Text style={styles.rowCell}>
        {formatCurrency(item.totalPrice)}
      </Text>
      <Text style={[styles.rowCell, { color: getStatusColor(item.status) }]}>
        {formatStatus(item.status)}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF5722" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchRentals(currentPage, filterStatus)}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={28} color="#1F2A44" />
              </TouchableOpacity>
              <Text style={styles.title}>Dashboard</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
                  <Ionicons name="notifications-outline" size={28} color="#1F2A44" />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {rentals.filter(item => item.status === 'pending').length}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.7}>
                  <Image
                    source={{ uri: 'https://via.placeholder.com/40' }}
                    style={styles.avatar}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.welcome}>Xin chào, Bimal</Text>

            {/* Quick Access Cards */}
            <View style={styles.infoRow}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('MotorManagement')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#4CAF50', '#66BB6A']}
                  style={styles.cardGradient}
                >
                  <FontAwesome5 name="motorcycle" size={32} color="#fff" />
                  <Text style={styles.cardTitle}>Quản lý xe</Text>
                  <View style={styles.cardMetric}>
                    <Text style={styles.cardMetricText}>{stats.motorbikes} xe hiện có</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ContractManagement')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#FF5722', '#FF8A65']}
                  style={styles.cardGradient}
                >
                  <Ionicons name="document-text-outline" size={32} color="#fff" />
                  <Text style={styles.cardTitle}>Hợp đồng</Text>
                  <View style={styles.cardMetric}>
                    <Text style={styles.cardMetricText}>{stats.contracts} hợp đồng</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <LinearGradient
                colors={['#A7F3D0', '#34D399']}
                style={styles.statCard}
              >
                <View style={styles.statIconContainer}>
                  <FontAwesome5 name="money-bill-wave" size={36} color="#1F2A44" />
                </View>
                <Text style={styles.statTitle}>Doanh thu</Text>
                <Text style={styles.statAmount}>25.001.000 VNĐ</Text>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#A7F3D0', '#34D399']}
                    style={[styles.progressFill, { width: '75%' }]}
                  />
                </View>
                <Text style={styles.statSubText}>+15% so với tháng trước</Text>
              </LinearGradient>
              <LinearGradient
                colors={['#67E8F9', '#06B6D4']}
                style={styles.statCard}
              >
                <View style={styles.statIconContainer}>
                  <Ionicons name="eye-outline" size={36} color="#1F2A44" />
                </View>
                <Text style={styles.statTitle}>Lượt xem</Text>
                <Text style={styles.statAmount}>1.500.055</Text>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#67E8F9', '#06B6D4']}
                    style={[styles.progressFill, { width: '90%' }]}
                  />
                </View>
                <Text style={styles.statSubText}>+10% so với tuần trước</Text>
              </LinearGradient>
            </View>

            {/* Filter Labels */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
              contentContainerStyle={styles.filterRowContent}
            >
              {['all', 'pending', 'active', 'completed', 'cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    filterStatus === status ? styles.filterButtonActive : styles.filterButtonInactive,
                  ]}
                  onPress={() => handleFilterChange(status)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={filterStatus === status ? ['#4CAF50', '#2E7D32'] : ['#fff', '#fff']}
                    style={styles.filterButtonGradient}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        filterStatus === status && styles.filterButtonTextActive,
                      ]}
                    >
                      {status === 'all' ? 'Tất cả' : formatStatus(status)}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Rentals List Header */}
            <Text style={styles.sectionTitle}>Đơn thuê xe</Text>
            {rentals.length > 0 && (
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>Xe</Text>
                <Text style={styles.headerCell}>Giá</Text>
                <Text style={styles.headerCell}>Trạng thái</Text>
              </View>
            )}
          </>
        }
        data={rentals}
        renderItem={renderItem}
        keyExtractor={(item) => item.rentalId.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>Không có đơn thuê nào</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />
        }
        ListFooterComponent={
          rentals.length > 0 && totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                activeOpacity={0.7}
              >
                <Text style={[styles.pageText, currentPage === 1 && styles.pageTextDisabled]}>
                  Trước
                </Text>
              </TouchableOpacity>
              {getPaginationRange().map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.pageButton, num === currentPage && styles.pageActive]}
                  onPress={() => setCurrentPage(num)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pageText, num === currentPage && styles.pageTextActive]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                activeOpacity={0.7}
              >
                <Text style={[styles.pageText, currentPage === totalPages && styles.pageTextDisabled]}>
                  Sau
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2A44',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
  },
  welcome: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2A44',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  cardMetric: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  cardMetricText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    width: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  statSubText: {
    fontSize: 12,
    color: '#6B7280',
  },
  filterRow: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterRowContent: {
    paddingRight: 16,
  },
  filterButton: {
    marginRight: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    overflow: 'hidden',
  },
  filterButtonActive: {
    borderColor: '#4CAF50',
  },
  filterButtonInactive: {
    borderColor: '#D1FAE5',
  },
  filterButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A44',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2A44',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A44',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rowCell: {
    flex: 1,
    fontSize: 14,
    color: '#1F2A44',
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  pageActive: {
    backgroundColor: '#4CAF50',
  },
  pageButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  pageText: {
    fontSize: 14,
    color: '#1F2A44',
    fontWeight: '500',
  },
  pageTextActive: {
    color: '#fff',
  },
  pageTextDisabled: {
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#1F2A44',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF5722',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
});

export default DashboardScreen;