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
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { RNCamera } from 'react-native-camera';
import { getAuthApi } from '../../utils/useAuthApi';
import { endpoints } from '../../configs/APIs';

export default function RentalDetailScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [rental, setRental] = useState(null);
  const [error, setError] = useState(null);
  const [timeStatus, setTimeStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { rentalId } = route.params;

  const api = getAuthApi();


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

      // Dữ liệu mẫu gốc
      const rentalData = response.data;

      let normalizedRental = {
        rentalId: rentalData.rentalId || 'N/A',
        renter: {
          email: rentalData.renter?.email || 'N/A',
          avatarUrl: rentalData.renter?.avatarUrl || null,
        },
        rentalContract: {
          bike: {
            name: rentalData.rentalContract?.bike?.name || 'N/A',
            bikeId: rentalData.rentalContract?.bike?.bikeId || null,
          },
          location: { address: rentalData.rentalContract?.location?.address || 'N/A' },
        },
        startDate: rentalData.startDate || 'N/A',
        endDate: rentalData.endDate || 'N/A',
        status: rentalData.status || 'confirmed',
        totalPrice: rentalData.totalPrice || 'N/A',
        paymentDeadline: rentalData.startDate,
        createdAt: rentalData.createdAt || new Date().toISOString(),
        paymentStatus: rentalData.paymentStatus || 'pending',
        cancelledBy: rentalData.cancelledBy || null,
      };

      const now = new Date();
      const startDate = new Date(normalizedRental.startDate);
      const endDate = new Date(normalizedRental.endDate);
      const paymentDeadline = new Date(normalizedRental.paymentDeadline);

      // Kiểm tra và tự động hủy nếu quá hạn xác nhận
      if (normalizedRental.status === 'pending' && normalizedRental.createdAt) {
        const createdAt = new Date(normalizedRental.createdAt);
        if (!isNaN(createdAt.getTime())) {
          const confirmationDeadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
          if (now > confirmationDeadline) {
            await api.patch(`/rentals/${rentalId}/status`, { status: 'cancelled' });
            normalizedRental.status = 'cancelled';
            normalizedRental.cancelledBy = 'system';
            console.log('Rental auto-cancelled due to expired confirmation deadline');
          }
        }
      }

      // Kiểm tra và tự động hủy nếu quá hạn thanh toán
      if (normalizedRental.status === 'confirmed' && normalizedRental.paymentStatus === 'pending' && now > paymentDeadline) {
        const paymentDeadline = new Date(normalizedRental.startDate);
        if (!isNaN(paymentDeadline.getTime()) && now > paymentDeadline) {
          await api.patch(`/rentals/${rentalId}/status`, { status: 'cancelled' });
          normalizedRental.status = 'cancelled';
          normalizedRental.cancelledBy = 'system';
          console.log('Rental auto-cancelled due to expired payment deadline');
        }
      }

      // Kiểm tra quá hạn hoặc không nhận xe
      if (normalizedRental.status === 'confirmed' && now > endDate) {
        await api.patch(`/rentals/${rentalId}/status`, { status: 'completed' });
        await updateBikeStatus(normalizedRental.rentalContract.bike.bikeId, 'available');
        normalizedRental.status = 'completed';
        console.log('Rental auto-completed due to end date passed without pickup');
      } else if (normalizedRental.status === 'active' && now > endDate) {
        await api.patch(`/rentals/${rentalId}/status`, { status: 'completed' });
        normalizedRental.status = 'completed';
        console.log('Rental marked as completed due to overdue');
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

  const updateBikeStatus = useCallback(async (bikeId, status) => {
    try {
      const api = await getAuthApi();
      await api.patch(endpoints['updateBikeStatus'], {
        bikeIds: [bikeId],
        status: status,
        rejectionReason: null,
      });
      console.log(`✅ Bike ${bikeId} status updated to "${status}"`);
    } catch (err) {
      console.error('❌ Error updating bike status:', err);
    }
  }, []);

  const calculateTimeStatus = useCallback(() => {
    if (!rental) return null;

    const now = new Date();
    let targetDate, label, isOverdue = false, paymentInfo = null;

    if (rental.status === 'pending' && rental.createdAt) {
      const createdAt = new Date(rental.createdAt);
      targetDate = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      label = 'Thời gian xác nhận còn lại';
      isOverdue = now > targetDate;
    } else if (rental.status === 'confirmed' && rental.paymentStatus === 'paid') {
      const startDate = new Date(rental.startDate);
      if (now < startDate) {
        targetDate = startDate;
        label = 'Thời gian đến khi nhận xe';
      } else {
        label = 'Sẵn sàng nhận xe';
        return { label, isOverdue: false };
      }
    } else if (rental.status === 'active') {
      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);
      if (now < startDate) {
        targetDate = startDate;
        label = 'Thời gian đến khi nhận xe';
      } else if (now <= endDate) {
        targetDate = endDate;
        label = 'Thời gian sử dụng còn lại';
      } else {
        return { label: 'Đã quá hạn', isOverdue: true };
      }

    } else if (rental.status === 'confirmed') {
      const paymentDeadline = new Date(rental.paymentDeadline);
      targetDate = paymentDeadline;
      label = 'Thông tin thanh toán';
      isOverdue = now > targetDate;
      paymentInfo = rental.paymentStatus === 'pending' ? 'Chưa thanh toán' : 'Đã thanh toán';
    } else if (rental.status === 'violated') {
      return { label: 'Đơn thuê vi phạm (quá hạn)', isOverdue: true };
    } else if (rental.status === 'completed') {
      return { label: 'Đơn thuê đã hoàn thành', isOverdue: false };
    } else if (rental.status === 'cancelled') {
      return { label: 'Đơn thuê đã bị hủy', isOverdue: true };
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

  useEffect(() => {
    const interval = setInterval(() => {
      const status = calculateTimeStatus();
      setTimeStatus(status);
      if (status && status.isOverdue && rental && rental.status !== 'cancelled' && rental.status !== 'completed') {
        fetchRentalDetail();
      }
    }, 60000);
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
      case 'violated': return 'Vi phạm';
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
      case 'violated': return '#B91C1C';
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
              const res = await api.get(endpoints['getRentalById'](rentalId));
              const rentalData = res.data;

              setRental(prev => ({ ...prev, status: 'confirmed' }));

              // await updateBikeStatus(rentalData.rentalContract.bike.bikeId, 'rented');
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
              await api.patch(`/rentals/${rentalId}/status`, { status: 'cancelled' });
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
  }, [rentalId, rental, fetchRentalDetail]);

  const handleGenerateQRCode = useCallback((type) => {
    setIsLoadingQR(true);
    const timestamp = new Date().toISOString();
    const qrData = JSON.stringify({ rentalId, type, timestamp });
    setTimeout(() => {
      setQrCode(qrData);
      setIsLoadingQR(false);
    }, 500);
  }, [rentalId]);

  const handleScanQRCode = useCallback(async (data) => {
    try {
      const qrData = JSON.parse(data);
      if (!qrData.rentalId || !qrData.type || !qrData.timestamp) {
        throw new Error('Mã QR không hợp lệ');
      }

      const now = new Date('2025-09-12T15:11:00+07:00');
      const qrTimestamp = new Date(qrData.timestamp);
      const timeDiff = (now - qrTimestamp) / (1000 * 60); // Phút
      if (timeDiff > 5) {
        throw new Error('Mã QR đã hết hạn');
      }

      if (qrData.rentalId !== rentalId) {
        throw new Error('Mã QR không khớp với đơn thuê');
      }

      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);

      const api = await getAuthApi();
      if (qrData.type === 'pickup') {
        if (rental.status !== 'confirmed' || rental.paymentStatus !== 'paid' || now < startDate || now > endDate) {
          throw new Error('Đơn thuê không ở trạng thái hợp lệ để nhận xe');
        }
        await api.patch(`/rentals/${rentalId}/status`, { status: 'active' });
        await updateBikeStatus(rental.rentalContract.bike.bikeId, 'rented');
        Alert.alert('Thành công', 'Đã xác nhận nhận xe!');
      } else if (qrData.type === 'return') {
        if (rental.status !== 'active' || timeStatus?.isOverdue) {
          throw new Error('Đơn thuê không ở trạng thái hợp lệ để trả xe');
        }
        await api.patch(`/rentals/${rentalId}/status`, { status: 'completed' });
        await updateBikeStatus(rental.rentalContract.bike.bikeId, 'available');
        Alert.alert('Thành công', 'Đã xác nhận trả xe!');
      } else {
        throw new Error('Loại mã QR không hợp lệ');
      }

      console.log(`QR Scan: rentalId=${qrData.rentalId}, type=${qrData.type}, timestamp=${qrData.timestamp}`);
      setQrCode(null);
      setShowScanner(false);
      fetchRentalDetail();
    } catch (err) {
      console.error('Lỗi xử lý mã QR:', err);
      Alert.alert('Lỗi', err.message || 'Không thể xử lý mã QR');
      setShowScanner(false);
    }
  }, [rentalId, rental, timeStatus, fetchRentalDetail]);

  const handleOpenScanner = useCallback(async () => {
    const hasPermission = await requestCameraPermission();
    if (hasPermission) {
      setShowScanner(true);
    } else {
      Alert.alert('Lỗi', 'Không có quyền truy cập camera');
    }
  }, []);

  const onBarCodeRead = useCallback(
    (event) => {
      if (showScanner) {
        handleScanQRCode(event.data);
      }
    },
    [handleScanQRCode, showScanner]
  );

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

  const isWithinRentalPeriod = () => {
    const now = new Date();
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);
    return now >= startDate && now <= endDate;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {showScanner ? (
        <View style={styles.scannerContainer}>
          <RNCamera
            style={styles.camera}
            onBarCodeRead={onBarCodeRead}
            captureAudio={false}
            barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
          >
            <View style={styles.scannerOverlay}>
              <Text style={styles.scannerText}>Quét mã QR</Text>
              <TouchableOpacity
                style={styles.cancelScannerButton}
                onPress={() => setShowScanner(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelScannerButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </RNCamera>
        </View>
      ) : (
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
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hạn thanh toán:</Text>
              <Text style={styles.detailValue}>{formatDate(rental.paymentDeadline)}</Text>
            </View>
          </View>

          {/* Time Status or QR Code */}
          {timeStatus && (
            <View style={styles.timeStatusContainer}>
              <Ionicons
                name={timeStatus.isOverdue ? 'close-circle-outline' : 'time-outline'}
                size={24}
                color={timeStatus.isOverdue ? '#B91C1C' : '#4CAF50'}
              />
              <View style={styles.timeStatusContent}>
                <Text style={styles.timeStatusLabel}>{timeStatus.label}</Text>
                {timeStatus.paymentInfo && (
                  <Text style={[styles.timeStatusValue, { color: timeStatus.isOverdue ? '#B91C1C' : '#4CAF50' }]}>
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

          {/* QR Code Section for Pickup */}
          {rental.status === 'confirmed' && rental.paymentStatus === 'paid' && isWithinRentalPeriod() && (
            <View style={styles.qrCodeContainer}>
              <Text style={styles.qrCodeTitle}>Mã QR để nhận xe</Text>
              {qrCode && JSON.parse(qrCode).type === 'pickup' ? (
                <>
                  <View style={styles.qrCodeWrapper}>
                    <QRCode value={qrCode} size={200} />
                  </View>
                  <TouchableOpacity
                    style={styles.qrActionButton}
                    onPress={handleOpenScanner}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.qrActionButtonText}>Quét mã QR (Nhận xe)</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.qrActionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleGenerateQRCode('pickup')}
                  activeOpacity={0.7}
                  disabled={isLoadingQR}
                >
                  {isLoadingQR ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.qrActionButtonText}>Tạo mã QR nhận xe</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* QR Code Section for Return */}
          {rental.status === 'active' && !timeStatus?.isOverdue && (
            <View style={styles.qrCodeContainer}>
              <Text style={styles.qrCodeTitle}>Mã QR để trả xe</Text>
              {qrCode && JSON.parse(qrCode).type === 'return' ? (
                <>
                  <View style={styles.qrCodeWrapper}>
                    <QRCode value={qrCode} size={200} />
                  </View>
                  <TouchableOpacity
                    style={styles.qrActionButton}
                    onPress={handleOpenScanner}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.qrActionButtonText}>Quét mã QR (Trả xe)</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.qrActionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleGenerateQRCode('return')}
                  activeOpacity={0.7}
                  disabled={isLoadingQR}
                >
                  {isLoadingQR ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.qrActionButtonText}>Tạo mã QR trả xe</Text>
                  )}
                </TouchableOpacity>
              )}
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
            {(rental.status === 'confirmed' || rental.status === 'pending') && rental.paymentStatus === 'pending' && (
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
      )}
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
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
  },
  cancelScannerButton: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelScannerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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
    paddingVertical: 10,
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
    marginLeft: 12,
  },
  timeStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
  },
  timeStatusValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  qrCodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 12,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#F9F9FB',
    borderRadius: 8,
    marginBottom: 12,
  },
  qrActionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
  },
  qrActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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