import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RNCamera } from 'react-native-camera';
import { getAuthApi } from '../../utils/useAuthApi';
import { endpoints } from '../../configs/APIs';

// Các bước tiến độ đơn hàng
const progressSteps = [
  { label: 'Đã gửi đơn', icon: 'paper-plane', completedStatus: ['pending', 'confirmed', 'paid', 'shipped', 'delivered'] },
  { label: 'Chủ xe chấp nhận', icon: 'checkmark', completedStatus: ['confirmed', 'paid', 'shipped', 'delivered'] },
  { label: 'Thanh toán', icon: 'cash', completedStatus: ['paid', 'shipped', 'delivered'] },
  { label: 'Bắt đầu thuê', icon: 'bicycle', completedStatus: ['shipped', 'delivered'] },
  { label: 'Kết thúc thuê', icon: 'flag', completedStatus: ['delivered'] },
];

const BookingDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const rental = route.params?.rental || {};
  const [rentalStatus, setRentalStatus] = useState(rental.status || 'pending');
  const [paymentStatus, setPaymentStatus] = useState(rental.paymentStatus || 'pending');
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Yêu cầu quyền truy cập Camera',
          message: 'Ứng dụng cần quyền truy cập camera để quét mã QR.',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Hủy',
          buttonPositive: 'Đồng ý',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const fetchRentalDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const api = await getAuthApi();
      const response = await api.get(`/rentals/${rental.rentalId}/renter`);
      const rentalData = response.data;
      setRentalStatus(rentalData.status || 'pending');
      setPaymentStatus(rentalData.paymentStatus || 'pending');
      console.log('Updated rental status:', rentalData.status, 'paymentStatus:', rentalData.paymentStatus);
    } catch (error) {
      console.error('Error fetching rental detail:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết đơn thuê');
    } finally {
      setIsLoading(false);
    }
  }, [rental.rentalId]);

  useEffect(() => {
    // Cập nhật trạng thái khi rental thay đổi
    setRentalStatus(rental.status || 'pending');
    setPaymentStatus(rental.paymentStatus || 'pending');

    // Kiểm tra và hủy đơn nếu quá hạn thanh toán
    const now = new Date();
    const paymentDeadline = new Date(rental.paymentDeadline || new Date(rental.startDate).getTime());
    if (rentalStatus === 'confirmed' && paymentStatus === 'pending' && now > paymentDeadline) {
      const cancelRental = async () => {
        try {
          const api = await getAuthApi();
          await api.patch(`/rentals/${rental.rentalId}/status`, { status: 'cancelled' });
          setRentalStatus('cancelled');
          console.log('Rental auto-cancelled due to expired payment deadline');
        } catch (err) {
          console.error('Error cancelling rental:', err);
        }
      };
      cancelRental();
    }
  }, [rental.status, rental.paymentStatus, rental.rentalId, rental.startDate, rental.paymentDeadline]);

  const handlePayment = () => {
    navigation.navigate('PaymentBooking', { rental });
  };

  const isCompleted = (step) => step.completedStatus.includes(rentalStatus);

  const isWithinRentalPeriod = () => {
    const now = new Date();
    const startDate = new Date(rental.startDate);
    const endDate = new Date(rental.endDate);
    return now >= startDate && now <= endDate;
  };

  const handleOpenScanner = useCallback(async (type) => {
    const hasPermission = await requestCameraPermission();
    if (hasPermission) {
      setShowScanner(type);
    } else {
      Alert.alert('Lỗi', 'Không có quyền truy cập camera');
    }
  }, []);

  const handleScanQRCode = useCallback(
    async (data) => {
      try {
        Alert.alert('DEBUG', '🚀 Bắt đầu handleScanQRCode');
        const qrData = JSON.parse(data);
        Alert.alert('DEBUG', '✅ Parse QR thành công: ' + JSON.stringify(qrData));

        if (!qrData.rentalId || !qrData.type || !qrData.timestamp) {
          Alert.alert('DEBUG', '❌ Thiếu field trong QR');
          throw new Error('Mã QR không hợp lệ');
        }

        const now = new Date();
        Alert.alert('DEBUG', '⏰ Thời gian hiện tại: ' + now.toISOString());

        const qrTimestamp = new Date(qrData.timestamp);
        const timeDiff = (now - qrTimestamp) / (1000 * 60);
        Alert.alert('DEBUG', '📌 timeDiff = ' + timeDiff);

        if (timeDiff > 5) {
          throw new Error('Mã QR đã hết hạn');
        }

        if (qrData.rentalId !== rental.rentalId) {
          throw new Error('Mã QR không khớp với đơn thuê');
        }

        const startDate = new Date(rental.startDate);
        const endDate = new Date(rental.endDate);
        Alert.alert('DEBUG', `📅 startDate=${startDate}, endDate=${endDate}`);

        const api = await getAuthApi();
        Alert.alert('DEBUG', '✅ Lấy được api instance');

        if (qrData.type === 'pickup') {
          Alert.alert('DEBUG', '🚲 Pickup flow');
          if (rentalStatus !== 'confirmed' || paymentStatus !== 'paid' || now < startDate || now > endDate) {
            throw new Error('Đơn thuê không ở trạng thái hợp lệ để nhận xe');
          }
          Alert.alert('DEBUG', '📡 Chuẩn bị gọi verify-qr pickup');
          try {
            const res = await api.post('/rentals/verify-qr', {
              rentalId: qrData.rentalId,
              type: 'pickup',
              timestamp: qrData.timestamp,
            });
            Alert.alert('DEBUG', '✅ verify-qr pickup gọi xong: ' + JSON.stringify(res.data));
          } catch (err) {
            Alert.alert('DEBUG', '❌ verify-qr pickup lỗi: ' + (err.response?.data?.message || err.message));
            throw err;   // để nhảy lên catch bên ngoài
          }

          Alert.alert('DEBUG', '✅ Gọi verify-qr pickup thành công');
          // await api.patch(`/rentals/${rental.rentalId}/status`, { status: 'active' });
          setRentalStatus('active');
          Alert.alert('Thành công', 'Đã xác nhận nhận xe!');
        } else if (qrData.type === 'return') {
          Alert.alert('DEBUG', '🔄 Return flow');
          if (rentalStatus !== 'active' || now > endDate) {
            throw new Error('Đơn thuê không ở trạng thái hợp lệ để trả xe');
          }
          await api.post('/rentals/verify-qr', { rentalId: qrData.rentalId, type: 'return', timestamp: qrData.timestamp });
          // await api.patch(`/rentals/${rental.rentalId}/status`, { status: 'completed' });
          setRentalStatus('completed');
          Alert.alert('Thành công', 'Đã xác nhận trả xe!');
        } else {
          throw new Error('Loại mã QR không hợp lệ');
        }

        setShowScanner(false);
        fetchRentalDetail();
      } catch (err) {
        console.error('❌ Lỗi xử lý mã QR:', err);
        Alert.alert('Lỗi', err.message || 'Không thể xử lý mã QR');
        setShowScanner(false);
      }
    },
    [rental.rentalId, rentalStatus, paymentStatus, rental.startDate, rental.endDate, fetchRentalDetail]
  );


  const onBarCodeRead = useCallback(
    (event) => {
      if (showScanner) {
        handleScanQRCode(event.data);
      }
    },
    [handleScanQRCode, showScanner]
  );

  // Xử lý dữ liệu từ rental
  const orderDetails = {
    orderId: rental.orderId || rental.rentalId || 'DH000000',
    date: rental.createdAt ? new Date(rental.createdAt).toLocaleDateString('vi-VN') : 'N/A',
    renterName: rental.renter?.fullName || rental.renter?.email || 'Khách hàng',
    ownerName: rental.rentalContract?.lessor?.fullName || 'Người bán',
    items: [
      {
        id: rental.rentalContract?.bike?.bikeId || 1,
        name: rental.rentalContract?.bike?.name || 'Xe không xác định',
        quantity: 1,
        price: rental.rentalContract?.bike?.pricePerDay || 0,
        image: rental.rentalContract?.bike?.imageUrl?.[0] || 'https://example.com/placeholder.jpg',
      },
    ],
    total: rental.totalPrice || rental.rentalContract?.bike?.pricePerDay || 0,
    shippingFee: rental.rentalContract?.serviceFee || 0,
    discount: 0,
    finalTotal: (rental.totalPrice || rental.rentalContract?.bike?.pricePerDay || 0) + (rental.rentalContract?.serviceFee || 0),
    shippingAddress: rental.rentalContract?.location?.address || 'N/A',
    paymentDeadline: rental.paymentDeadline
      ? new Date(rental.paymentDeadline).toLocaleDateString('vi-VN')
      : new Date(new Date(rental.startDate).getTime() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'),
    startDate: rental.startDate ? new Date(rental.startDate).toLocaleDateString('vi-VN') : 'N/A',
    endDate: rental.endDate ? new Date(rental.endDate).toLocaleDateString('vi-VN') : 'N/A',
  };

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
              <Text style={styles.scannerText}>Quét mã QR {showScanner === 'pickup' ? 'nhận xe' : 'trả xe'}</Text>
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
            <Text style={styles.title}>Chi tiết đơn hàng {orderDetails.orderId}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Thanh tiến độ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiến độ đơn hàng</Text>
            <View style={styles.progressContainer}>
              {progressSteps.map((step, index) => (
                <View key={index} style={styles.progressStep}>
                  <View style={[styles.progressIcon, isCompleted(step) ? styles.completedIcon : null]}>
                    <Ionicons name={step.icon} size={24} color={isCompleted(step) ? '#fff' : '#6B7280'} />
                  </View>
                  <Text style={[styles.progressLabel, isCompleted(step) ? styles.completedLabel : null]}>
                    {step.label}
                  </Text>
                  {index < progressSteps.length - 1 && (
                    <View style={[styles.progressLine, isCompleted(progressSteps[index + 1]) ? styles.completedLine : null]} />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Thông tin đơn hàng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Mã đơn hàng:</Text>
              <Text style={styles.value}>{orderDetails.orderId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ngày đặt:</Text>
              <Text style={styles.value}>{orderDetails.date}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Người thuê:</Text>
              <Text style={styles.value}>{orderDetails.renterName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Người bán:</Text>
              <Text style={styles.value}>{orderDetails.ownerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Trạng thái:</Text>
              <Text style={[styles.value, { color: rentalStatus === 'pending' ? '#F59E0B' : '#4CAF50' }]}>
                {rentalStatus === 'pending'
                  ? 'Đang chờ duyệt'
                  : rentalStatus === 'shipped'
                    ? 'Đang thuê'
                    : rentalStatus === 'delivered'
                      ? 'Hoàn thành'
                      : rentalStatus === 'cancelled'
                        ? 'Đã hủy'
                        : rentalStatus === 'violated'
                          ? 'Vi phạm'
                          : 'Đã xác nhận'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Hạn thanh toán:</Text>
              <Text style={styles.value}>{orderDetails.paymentDeadline}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ngày thuê:</Text>
              <Text style={styles.value}>{`${orderDetails.startDate} - ${orderDetails.endDate}`}</Text>
            </View>
          </View>

          {/* Danh sách dịch vụ thuê */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dịch vụ thuê</Text>
            {orderDetails.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)}đ/Ngày</Text>
                </View>
              </View>
            ))}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tổng tiền:</Text>
              <Text style={styles.value}>{formatCurrency(orderDetails.total)}đ</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phí dịch vụ:</Text>
              <Text style={styles.value}>{formatCurrency(orderDetails.shippingFee)}đ</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tổng cộng:</Text>
              <Text style={[styles.value, styles.finalTotal]}>{formatCurrency(orderDetails.finalTotal)}đ</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Địa chỉ nhận xe:</Text>
              <Text style={[styles.value, styles.address]}>{orderDetails.shippingAddress}</Text>
            </View>
          </View>

          {/* Nút hành động */}
          {rentalStatus === 'confirmed' && paymentStatus === 'pending' && (
            <TouchableOpacity style={styles.paymentButton} onPress={handlePayment} activeOpacity={0.7}>
              <Text style={styles.buttonText}>Thanh toán</Text>
            </TouchableOpacity>
          )}

          {/* Nút quét mã QR nhận xe */}
          {rentalStatus === 'confirmed' && paymentStatus === 'paid' && isWithinRentalPeriod() && (
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => handleOpenScanner('pickup')}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Quét mã QR nhận xe</Text>
            </TouchableOpacity>
          )}

          {/* Nút quét mã QR trả xe */}
          {rentalStatus === 'active' && isWithinRentalPeriod() && (
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => handleOpenScanner('return')}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Quét mã QR trả xe</Text>
            </TouchableOpacity>
          )}

          {/* Thông báo khi trạng thái là pending */}
          {rentalStatus === 'pending' && (
            <Text style={styles.pendingText}>Đang chờ người bán duyệt đơn hàng...</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const formatCurrency = (amount) => {
  return amount.toLocaleString('vi-VN');
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2A44',
  },
  headerSpacer: {
    width: 28,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2A44',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  progressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completedIcon: {
    backgroundColor: '#4CAF50',
  },
  progressLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  completedLabel: {
    color: '#1F2A44',
    fontWeight: '600',
  },
  progressLine: {
    position: 'absolute',
    left: 20,
    top: 40,
    height: 16,
    width: 2,
    backgroundColor: '#ddd',
  },
  completedLine: {
    backgroundColor: '#4CAF50',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
    flex: 2,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2A44',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5722',
    marginTop: 4,
  },
  finalTotal: {
    color: '#FF5722',
    fontSize: 18,
  },
  address: {
    fontSize: 16,
    color: '#1F2A44',
  },
  pendingText: {
    fontSize: 16,
    color: '#F59E0B',
    textAlign: 'center',
    marginVertical: 20,
  },
  paymentButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  qrButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
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
});

export default BookingDetailScreen;