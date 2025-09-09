import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuthApi } from '../../utils/useAuthApi';
import { endpoints } from '../../configs/APIs';

export default function DashboardScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [rentals, setRentals] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const navigation = useNavigation();

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

      console.log(`Fetching rentals: status=${status}, page=${page}, endpoint=${endpoint}`);
      const response = await api.get(endpoint, { params: { page, limit: 5 } });
      console.log('API response:', JSON.stringify(response.data, null, 2));

      let rentalData = [];
      let pages = 1;

      if (response.data) {
        if (Array.isArray(response.data)) {
          rentalData = response.data;
          pages = response.data.totalPages || 1;
        } else if (Array.isArray(response.data.data)) {
          rentalData = response.data.data;
          pages = response.data.totalPages || 1;
        } else if (typeof response.data === 'object' && response.data !== null) {
          rentalData = [response.data];
          pages = 1;
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
    } catch (error) {
      console.error(`Error fetching ${status} rentals:`, error.message, error.response?.data);
      setError(error.message || 'Không thể tải danh sách đơn thuê xe');
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách đơn thuê xe');
      setRentals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRentals(currentPage, filterStatus);
  }, [currentPage, filterStatus, fetchRentals]);

  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return 'N/A';
    }
  }, []);

  const formatStatus = useCallback((status) => {
    switch (status) {
      case 'pending': return 'Đang chờ';
      case 'active': return 'Đang thuê';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status || 'N/A';
    }
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'pending': return '#FFCA28';
      case 'active': return '#4CAF50';
      case 'completed': return '#22C55E';
      case 'cancelled': return '#FF5722';
      default: return '#6B7280';
    }
  }, []);

  const formatCurrency = useCallback((value) => {
    return value ? value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : 'N/A';
  }, []);

  const handleRentalAction = useCallback((rentalId) => {
    console.log('Navigating to RentalDetail:', rentalId);
    navigation.navigate('RentalDetail', { rentalId });
  }, [navigation]);

  const handleFilterChange = useCallback((status) => {
    console.log('Changing filter to:', status);
    setFilterStatus(status);
    setCurrentPage(1);
  }, []);

  const memoizedRentals = useMemo(() => rentals, [rentals]);

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
      <ScrollView style={styles.container}>
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
                  {memoizedRentals.filter(item => item.status === 'pending').length}
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
                <Text style={styles.cardMetricText}>8 xe</Text>
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
                <Text style={styles.cardMetricText}>2 hợp đồng</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <FontAwesome5 name="money-bill-wave" size={28} color="#4CAF50" />
            <Text style={styles.statTitle}>Doanh thu</Text>
            <Text style={styles.statAmount}>25.001.000 VNĐ</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '75%' }]} />
            </View>
            <Text style={styles.statSubtext}>+15% so với tháng trước</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="eye-outline" size={28} color="#FF5722" />
            <Text style={styles.statTitle}>Lượt xem</Text>
            <Text style={styles.statAmount}>1.500.055</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '90%', backgroundColor: '#FF5722' }]} />
            </View>
            <Text style={styles.statSubtext}>+10% so với tuần trước</Text>
          </View>
        </View>

        {/* Filter Labels */}
        <View style={styles.filterRow}>
          {['all', 'pending', 'active', 'completed', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
              onPress={() => handleFilterChange(status)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status === 'all' ? 'Tất cả' : formatStatus(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rentals List */}
        <Text style={styles.sectionTitle}>Đơn thuê xe</Text>
        {memoizedRentals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>Không có đơn thuê nào</Text>
          </View>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Xe</Text>
              <Text style={styles.headerCell}>Giá</Text>
              <Text style={styles.headerCell}>Trạng thái</Text>
            </View>
            {memoizedRentals.map((item) => (
              <TouchableOpacity
                key={item.rentalId}
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
            ))}
          </>
        )}

        {/* Pagination */}
        {memoizedRentals.length > 0 && totalPages > 1 && (
          <View style={styles.pagination}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2A44',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 12,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
    marginBottom: 12,
  },
  cardMetric: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cardMetricText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  statSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
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
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  rowCell: {
    flex: 1,
    fontSize: 14,
    color: '#1F2A44',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pageActive: {
    backgroundColor: '#4CAF50',
  },
  pageText: {
    fontSize: 14,
    color: '#1F2A44',
  },
  pageTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#1F2A44',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF5722',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});