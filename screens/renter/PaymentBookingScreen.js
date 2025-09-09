import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatePicker from 'react-native-date-picker';
import { endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthApi } from '../../utils/useAuthApi';
import jwt_decode from 'jwt-decode';
import { useNavigation } from '@react-navigation/native';

export default function PaymentBookingScreen({ route }) {
  const { rental } = route.params || {};
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [renterId, setRenterId] = useState(null);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const navigation = useNavigation();

  const paymentMethods = [
    { name: 'Momo', icon: 'wallet' },
    { name: 'VNPay', icon: 'card' },
  ];

  // Xử lý trạng thái: ánh xạ rental.rentalContract.status nếu rental.status là null
  const rentalStatus = rental?.status || (rental?.rentalContract?.status === 'active' ? 'confirmed' : 'pending');

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('access-token');
      if (token) {
        const decoded = jwt_decode(token);
        setRenterId(decoded.userId);
      }
    } catch (error) {
      console.error('Lỗi khi lấy user:', error);
      Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng.');
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getDays = (start, end) => {
    if (!start || !end) return 0;
    const startNorm = normalizeDate(start);
    const endNorm = normalizeDate(end);
    return Math.ceil((endNorm - startNorm) / (1000 * 60 * 60 * 24));
  };

  const formatCurrency = (value) => {
    if (!value) return '0 VNĐ';
    return value.toLocaleString('vi-VN') + ' VNĐ';
  };

  const createRental = async () => {
    if (rentalStatus !== 'confirmed') {
      Alert.alert('Thông báo', 'Đơn hàng đang chờ chủ xe chấp nhận. Vui lòng chờ.');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày bắt đầu và kết thúc.');
      return;
    }

    const days = getDays(startDate, endDate);
    if (days <= 0) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }

    const totalPrice = (rental?.rentalContract?.bike?.pricePerDay || 0) * days + (rental?.rentalContract?.serviceFee || 0);

    if (selectedPaymentMethod === 'VNPay') {
      try {
        const api = await getAuthApi();
        const response = await api.get(endpoints['createVNPay'], {
          params: {
            amount: totalPrice,
            orderInfo: `Thanh toan don hang #${rental?.rentalId || 'unknown'}`,
            bankCode: 'NCB',
          },
        });
        console.log('VNPay response:', response.data);

        const paymentUrl = response.data.paymentUrl;
        if (!paymentUrl) {
          throw new Error('Không nhận được URL thanh toán từ VNPay.');
        }
        console.log('VNPay payment URL:', paymentUrl);
        navigation.navigate('VNPayWeb', {
          paymentUrl,
          onSuccess: () => {
            // createRentalAPI(totalPrice);
            console.log('Thanh toán VNPay thành công');
          },
        });
      } catch (error) {
        console.error('Lỗi khi tạo link VNPay:', error);
        Alert.alert('Lỗi', 'Không thể khởi tạo thanh toán VNPay.');
      }
    } else if (selectedPaymentMethod === 'Momo') {
      try {
        // const rentalId = await createRentalAPI();
        // console.log('Momo payment created:', rentalId);
        // console.log('Số tiền thanh toán:', totalPrice);
        const rentalId = rental?.rentalId || orderId;
        navigation.navigate('MomoPayment', {
          orderId: rentalId,
          amount: totalPrice,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        });
      } catch (error) {
        console.error('Lỗi khi xử lý MoMo:', error.response?.data || error.message);
        Alert.alert('Lỗi', 'Không thể khởi tạo thanh toán MoMo.');
      }
    } else {
      Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán.');
    }
  };

  const createRentalAPI = async () => {
    const totalPrice = (rental?.rentalContract?.bike?.pricePerDay || 0) * getDays(startDate, endDate) + (rental?.rentalContract?.serviceFee || 0);

    try {
      const api = await getAuthApi();
      const res = await api.post(endpoints['createRental'], {
        rentalId: rental?.rentalId || null,
        contractId: rental?.rentalContract?.contractId || null,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalPrice: totalPrice,
        renterId: renterId,
      });

      const returnedRentalId = res.data?.rentalId;
      if (returnedRentalId) {
        setOrderId(returnedRentalId);
        Alert.alert('Thành công', `Bạn đã đặt xe thành công!\nMã đơn: ${returnedRentalId}`);
        return returnedRentalId;
      } else {
        throw new Error('Không nhận được rentalId từ server.');
      }
    } catch (err) {
      console.error('Lỗi khi tạo đơn thuê:', err.response?.data || err.message);
      Alert.alert('Lỗi', 'Không thể tạo đơn thuê.');
      throw err;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Thanh toán đơn hàng #{rental?.rentalId || 'N/A'}</Text>
        </View>

        {/* Bike Info */}
        <View style={styles.card}>
          <Image
            source={{ uri: rental?.rentalContract?.bike?.imageUrl?.[0] || 'https://example.com/placeholder.jpg' }}
            style={styles.bikeImage}
            resizeMode="cover"
          />
          <View style={styles.cardInfo}>
            <Text style={styles.bikeName}>{rental?.rentalContract?.bike?.name || 'Xe không xác định'}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FFCA28" />
              <Text style={styles.ratingText}>4.8 (73)</Text>
            </View>
            <Text style={styles.locationText}>
              Địa điểm: {rental?.rentalContract?.bike?.location?.name || 'N/A'}
            </Text>
            <Text style={styles.priceText}>
              {formatCurrency(rental?.rentalContract?.bike?.pricePerDay)} <Text style={styles.perDay}>/ ngày</Text>
            </Text>
          </View>
        </View>

        {/* Status Info */}
        {rentalStatus !== 'confirmed' && (
          <View style={styles.statusSection}>
            <Text style={styles.statusText}>
              Đơn hàng đang chờ chủ xe chấp nhận. Vui lòng chờ xác nhận để tiếp tục thanh toán.
            </Text>
          </View>
        )}

        {/* Date Selection, Price Details, Payment Method */}
        {rentalStatus === 'confirmed' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chọn ngày thuê</Text>
              <TouchableOpacity onPress={() => setIsStartOpen(true)} style={styles.dateButton}>
                <Ionicons name="calendar-outline" size={20} color="#4CAF50" style={styles.dateIcon} />
                <Text style={styles.dateText}>
                  Ngày bắt đầu: {startDate ? startDate.toLocaleDateString('vi-VN') : 'Chọn ngày'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEndOpen(true)} style={styles.dateButton}>
                <Ionicons name="calendar-outline" size={20} color="#4CAF50" style={styles.dateIcon} />
                <Text style={styles.dateText}>
                  Ngày kết thúc: {endDate ? endDate.toLocaleDateString('vi-VN') : 'Chọn ngày'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chi tiết giá</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Giá thuê / ngày</Text>
                <Text style={styles.priceValue}>{formatCurrency(rental?.rentalContract?.bike?.pricePerDay)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Phí dịch vụ</Text>
                <Text style={styles.priceValue}>{formatCurrency(rental?.rentalContract?.serviceFee)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Số ngày thuê</Text>
                <Text style={styles.priceValue}>{getDays(startDate, endDate)} ngày</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tổng giá</Text>
                <Text style={[styles.priceValue, styles.totalPrice]}>
                  {formatCurrency(
                    (rental?.rentalContract?.bike?.pricePerDay || 0) * getDays(startDate, endDate) +
                    (rental?.rentalContract?.serviceFee || 0)
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
              {paymentMethods.map((method, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedPaymentMethod(method.name)}
                  style={[
                    styles.paymentOption,
                    selectedPaymentMethod === method.name && styles.selectedPaymentOption,
                  ]}
                >
                  <Ionicons
                    name={method.icon}
                    size={24}
                    color={selectedPaymentMethod === method.name ? '#4CAF50' : '#6B7280'}
                    style={styles.paymentIcon}
                  />
                  <Text
                    style={[
                      styles.paymentText,
                      selectedPaymentMethod === method.name && styles.selectedPaymentText,
                    ]}
                  >
                    {method.name}
                  </Text>
                  {selectedPaymentMethod === method.name && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={createRental}>
              <Text style={styles.confirmButtonText}>Xác nhận và thanh toán</Text>
            </TouchableOpacity>
          </>
        )}

        <DatePicker
          modal
          mode="date"
          open={isStartOpen}
          date={startDate || new Date()}
          minimumDate={new Date()}
          onConfirm={(date) => {
            setIsStartOpen(false);
            setStartDate(date);
          }}
          onCancel={() => setIsStartOpen(false)}
        />
        <DatePicker
          modal
          mode="date"
          open={isEndOpen}
          date={endDate || new Date()}
          minimumDate={startDate || new Date()}
          onConfirm={(date) => {
            setIsEndOpen(false);
            setEndDate(date);
          }}
          onCancel={() => setIsEndOpen(false)}
        />
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2A44',
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
  statusSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    color: '#F59E0B',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2A44',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  bikeImage: {
    width: 120,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
  },
  bikeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2A44',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  perDay: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#1F2A44',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
  },
  totalPrice: {
    fontSize: 18,
    color: '#FF5722',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  selectedPaymentOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  paymentIcon: {
    marginRight: 12,
  },
  paymentText: {
    fontSize: 16,
    color: '#1F2A44',
    flex: 1,
  },
  selectedPaymentText: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  checkIcon: {
    marginLeft: 8,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});