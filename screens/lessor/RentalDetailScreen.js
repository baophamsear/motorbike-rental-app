import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getAuthApi } from '../../utils/useAuthApi';

export default function RentalDetailScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [rental, setRental] = useState(null);
  const [error, setError] = useState(null);
  const [timeStatus, setTimeStatus] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { rentalId } = route.params;

  const fetchRentalDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const api = await getAuthApi();
      if (!api) {
        throw new Error('Không thể khởi tạo API client');
      }

      console.log(`Fetching rental detail: id=${rentalId}`);
      const response = await api.get(`/rentals/${rentalId}`);
      console.log('API response:', JSON.stringify(response.data, null, 2));

      const rentalData = response.data || {};
      let normalizedRental = {
        rentalId: rentalData.rentalId || 'N/A',
        renter: {
          email: rentalData.renter?.email || 'N/A',
          avatarUrl: rentalData.renter?.avatarUrl || null,
        },
        rentalContract: {
          bike: { name: rentalData.rentalContract?.bike?.name || 'N/A' },
          location: { address: rentalData.rentalContract?.location?.address || 'N/A' },
        },
        startDate: rentalData.startDate || null,
        endDate: rentalData.endDate || null,
        status: rentalData.status || 'N/A',
        totalPrice: rentalData.totalPrice || 0,
        paymentDeadline: rentalData.paymentDeadline || null,
        createdAt: rentalData.createdAt || null,
        paymentStatus: rentalData.paymentStatus || 'pending',
        cancelledBy: rentalData.cancelledBy || null,
      };

      // Tính confirmationDeadline cho pending (createdAt + 24 giờ)
      if (normalizedRental.status === 'pending' && normalizedRental.createdAt) {
        const createdAt = new Date(normalizedRental.createdAt);
        const confirmationDeadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();
        if (now > confirmationDeadline) {
          try {
            await api.patch(`/rentals/${rentalId}/status`, { status: 'cancelled' });
            normalizedRental.status = 'cancelled';
            normalizedRental.cancelledBy = 'system';
            console.log('Rental auto-cancelled due to expired confirmation deadline');
          } catch (err) {
            console.error('Error auto-cancelling rental:', err);
          }
        }
      }

      // Kiểm tra và tự động hủy nếu quá hạn thanh toán
      if (normalizedRental.status === 'confirmed' && normalizedRental.paymentDeadline && normalizedRental.paymentStatus === 'pending') {
        const deadline = new Date(normalizedRental.paymentDeadline);
        const now = new Date();
        if (now > deadline) {
          try {
            await api.patch(`/rentals/${rentalId}/status`, { status: 'cancelled' });
            normalizedRental.status = 'cancelled';
            normalizedRental.cancelledBy = 'system';
            console.log('Rental auto-cancelled due to expired payment deadline');
          } catch (err) {
            console.error('Error auto-cancelling rental:', err);
          }
        }
      }

      setRental(normalizedRental);
    } catch (error) {
      console.error('Error fetching rental detail:', error.message, error.response?.data);
      setError(error.message || 'Không thể tải chi tiết đơn thuê');
      Alert.alert('Lỗi', error.message || 'Không thể tải chi tiết đơn thuê');
    } finally {
      setIsLoading(false);
    }
  }, [rentalId]);

  // Tính thời gian còn lại và trạng thái thanh toán
  const calculateTimeStatus = useCallback(() => {
    if (!rental) return null;

    const now = new Date();
    let targetDate, label, isOverdue = false, paymentInfo = null;

    if (rental.status === 'pending' && rental.createdAt) {
      const createdAt = new Date(rental.createdAt);
      targetDate = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000); // +24 giờ
      label = 'Thời gian xác nhận còn lại';
      isOverdue = now > targetDate;
    } else if (rental.status === 'confirmed' && rental.paymentDeadline && rental.paymentStatus === 'pending') {
      targetDate = new Date(rental.paymentDeadline);
      label = 'Thời gian thanh toán còn lại';
      isOverdue = now > targetDate;
      paymentInfo = `Số tiền cần thanh toán: ${formatCurrency(rental.totalPrice)}`;
    } else if (rental.status === 'active') {
      paymentInfo = `Số tiền đã thanh toán: ${formatCurrency(rental.totalPrice)}`;
      const start = new Date(rental.startDate);
      const end = new Date(rental.endDate);
      if (now < start) {
        targetDate = start;
        label = 'Thời gian đến khi nhận xe';
      } else if (now >= start && now <= end) {
        targetDate = end;
        label = 'Thời gian sử dụng còn lại';
      } else {
        return { label: 'Số tiền đã thanh toán', paymentInfo, isOverdue: false };
      }
    } else if (rental.status === 'cancelled') {
      return { label: 'Đơn thuê đã bị hủy', isOverdue: true };
    } else {
      return null;
    }

    if (!targetDate) return { label, paymentInfo, isOverdue };

    const diffMs = isOverdue ? now - targetDate : targetDate - now;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      days: isOverdue ? -days : days,
      hours: isOverdue ? -hours : hours,
      minutes: isOverdue ? -minutes : minutes,
      label,
      paymentInfo,
      isOverdue,
    };
  }, [rental]);

  useEffect(() => {
    fetchRentalDetail();
  }, [fetchRentalDetail]);

  // Cập nhật thời gian mỗi phút
  useEffect(() => {
    const interval = setInterval(() => {
      const status = calculateTimeStatus();
      setTimeStatus(status);
      if (status && status.isOverdue && rental && rental.status !== 'cancelled') {
        fetchRentalDetail();
      }
    }, 60000); // Cập nhật mỗi phút
    setTimeStatus(calculateTimeStatus());
    return () => clearInterval(interval);
  }, [calculateTimeStatus, rental, fetchRentalDetail]);

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
      case 'confirmed': return 'Đã xác nhận';
      case 'active': return 'Đang thuê';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status || 'N/A';
    }
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'pending': return '#FFCA28';
      case 'confirmed': return '#4CAF50';
      case 'active': return '#4CAF50';
      case 'completed': return '#22C55E';
      case 'cancelled': return '#FF5722';
      default: return '#6B7280';
    }
  }, []);

  const formatCurrency = useCallback((value) => {
    return value ? value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : 'N/A';
  }, []);

  const handleConfirmRental = useCallback(() => {
    Alert.alert(
      'Xác nhận đơn thuê',
      'Bạn có chắc chắn muốn xác nhận đơn thuê này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const api = await getAuthApi();
              await api.patch(`/rentals/${rentalId}/status`, { status: 'confirmed' });
              Alert.alert('Thành công', 'Đơn thuê đã được xác nhận!');
              fetchRentalDetail();
            } catch (err) {
              console.error('Lỗi xử lý đơn thuê:', err);
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn thuê');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [rentalId, fetchRentalDetail]);

  const handleCancelRental = useCallback(() => {
    Alert.alert(
      'Hủy đơn thuê',
      'Bạn có chắc chắn muốn hủy đơn thuê này không?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            try {
              const api = await getAuthApi();
              await api.patch(`/rentals/${rentalId}/status`, { status: 'cancelled', cancelledBy: 'owner' });
              Alert.alert('Thành công', 'Đơn thuê đã bị hủy!');
              fetchRentalDetail();
            } catch (err) {
              console.error('Lỗi hủy đơn thuê:', err);
              Alert.alert('Lỗi', 'Không thể hủy đơn thuê');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [rentalId, fetchRentalDetail]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
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
            onPress={fetchRentalDetail}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!rental) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF5722" />
          <Text style={styles.errorText}>Không tìm thấy đơn thuê</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Quay lại</Text>
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
          <Text style={styles.title}>Chi tiết đơn thuê</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Rental Detail Card */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mã đơn thuê:</Text>
            <Text style={styles.detailValue}>{rental.rentalId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Người thuê:</Text>
            <View style={styles.renterInfo}>
              {rental.renter.avatarUrl && (
                <Image
                  source={{ uri: rental.renter.avatarUrl }}
                  style={styles.renterAvatar}
                />
              )}
              <Text style={styles.detailValue}>{rental.renter.email}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Xe:</Text>
            <Text style={styles.detailValue}>{rental.rentalContract.bike.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Địa điểm:</Text>
            <Text style={styles.detailValue}>{rental.rentalContract.location.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngày thuê:</Text>
            <Text style={styles.detailValue}>
              {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Giá:</Text>
            <Text style={styles.detailValue}>{formatCurrency(rental.totalPrice)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trạng thái:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(rental.status) }]}>
              {formatStatus(rental.status)}
            </Text>
          </View>
        </View>

        {/* Time Status or Payment Info */}
        {timeStatus && (
          <View style={styles.timeStatusContainer}>
            <Ionicons
              name={timeStatus.isOverdue ? 'close-circle-outline' : 'time-outline'}
              size={24}
              color={timeStatus.isOverdue ? '#FF5722' : '#4CAF50'}
            />
            <View style={styles.timeStatusContent}>
              <Text style={styles.timeStatusLabel}>{timeStatus.label}</Text>
              {timeStatus.paymentInfo && (
                <Text style={[styles.timeStatusValue, { color: timeStatus.isOverdue ? '#FF5722' : '#4CAF50' }]}>
                  {timeStatus.paymentInfo}
                </Text>
              )}
              {!timeStatus.isOverdue && timeStatus.days !== undefined && (
                <Text style={[styles.timeStatusValue, { color: '#4CAF50' }]}>
                  {Math.abs(timeStatus.days) > 0 ? `${Math.abs(timeStatus.days)} ngày ` : ''}
                  {Math.abs(timeStatus.hours) > 0 ? `${Math.abs(timeStatus.hours)} giờ ` : ''}
                  {Math.abs(timeStatus.minutes)} phút
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {rental.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FFCA28' }]}
              onPress={handleConfirmRental}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Xác nhận đơn thuê</Text>
            </TouchableOpacity>
          )}
          {rental.status === 'confirmed' && rental.paymentStatus === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF5722' }]}
              onPress={handleCancelRental}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Hủy đơn thuê</Text>
            </TouchableOpacity>
          )}
        </View>
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
  headerSpacer: {
    width: 28,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2A44',
    flex: 2,
    textAlign: 'right',
  },
  renterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  renterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  timeStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  timeStatusContent: {
    flex: 1,
    marginLeft: 8,
  },
  timeStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
  },
  timeStatusValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
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