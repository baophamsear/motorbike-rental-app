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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthApi } from '../../utils/useAuthApi';
import jwt_decode from 'jwt-decode';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

export default function PaymentBookingScreen({ route }) {
  const { rental } = route.params || {};
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [renterId, setRenterId] = useState(null);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [appTransId, setAppTransId] = useState(null);
  const [useWebView, setUseWebView] = useState(false);
  const navigation = useNavigation();

  const paymentMethods = [
    { name: 'Momo', icon: 'wallet' },
    { name: 'VNPay', icon: 'card' },
    { name: 'ZaloPay', icon: 'cash-outline' },
  ];

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

  const checkStatus = async (appTransId, retries = 3, delay = 1000) => {
    try {
      const api = await getAuthApi();
      const response = await api.get(`http://192.168.1.7:8080/api/zalopay/checkstatus/${appTransId}`);
      const { returncode, returnmessage } = response.data;

      if (returncode === 1 && returnmessage === 'Giao dịch thành công') {
        // Thanh toán thành công, gọi updateActiveRental
        try {
          const rentalId = rental?.rentalId;
          const days = getDays(startDate, endDate);
          const totalAmount = (rental?.rentalContract?.bike?.pricePerDay || 0) * days + (rental?.rentalContract?.serviceFee || 0);

          if (!rentalId || !startDate || !endDate || !totalAmount) {
            throw new Error('Thiếu thông tin để cập nhật đơn hàng.');
          }

          await api.patch(endpoints.updateActiveRental(rentalId), {
            startDate: startDate.toISOString().split('T')[0], // Định dạng YYYY-MM-DD
            endDate: endDate.toISOString().split('T')[0], // Định dạng YYYY-MM-DD
            totalAmount,
          });
          console.log('updateActiveRental response:', { rentalId, startDate, endDate, totalAmount });
          Alert.alert('Thành công', 'Thanh toán ZaloPay thành công và đơn hàng đã được cập nhật!');
          navigation.navigate('Home');
        } catch (updateError) {
          console.error('Lỗi khi cập nhật đơn hàng:', updateError.response?.data || updateError.message);
          Alert.alert('Lỗi', 'Thanh toán thành công nhưng không thể cập nhật đơn hàng: ' + (updateError.message || 'Lỗi không xác định'));
        }
      } else {
        throw new Error(returnmessage || 'Kiểm tra trạng thái thất bại.');
      }
    } catch (error) {
      if (retries > 0) {
        console.log(`Thử lại checkStatus, còn ${retries} lần...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return checkStatus(appTransId, retries - 1, delay);
      }
      console.error('Lỗi khi kiểm tra trạng thái ZaloPay:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Kiểm tra trạng thái thanh toán ZaloPay thất bại: ' + (error.response?.data?.returnmessage || error.message));
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('Màn hình PaymentBookingScreen được focus, kiểm tra trạng thái thanh toán...');
      if (appTransId && selectedPaymentMethod === 'ZaloPay') {
        console.log('Gọi checkStatus với appTransId:', appTransId);
        checkStatus(appTransId);
      }
      // Có thể reset trạng thái nếu muốn reload giao diện
      // setStartDate(null);
      // setEndDate(null);
      // setSelectedPaymentMethod(null);
      // setPaymentUrl(null);
      // setUseWebView(false);

      return () => {
        console.log('Màn hình PaymentBookingScreen mất focus.');
      };
    }, [appTransId, selectedPaymentMethod])
  );

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
        const paymentUrl = response.data.order_url;
        if (!paymentUrl) {
          throw new Error('Không nhận được URL thanh toán từ VNPay.');
        }
        navigation.navigate('VNPayWeb', { paymentUrl });
      } catch (error) {
        console.error('Lỗi khi tạo link VNPay:', error);
        Alert.alert('Lỗi', 'Không thể khởi tạo thanh toán VNPay.');
      }
    } else if (selectedPaymentMethod === 'Momo') {
      try {
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
    } else if (selectedPaymentMethod === 'ZaloPay') {
      try {
        const api = await getAuthApi();
        const response = await api.post(endpoints['createZaloPayOrder'] || 'http://192.168.1.7:8080/api/zalopay/create-order', {
          orderId: rental?.rentalId || orderId,
          amount: totalPrice,
          userId: renterId,
        });
        const { return_code, sub_return_code, order_url, app_trans_id } = response.data;
        if (return_code !== 1 || sub_return_code !== 1 || !order_url) {
          throw new Error('Không nhận được URL thanh toán từ ZaloPay: ' + (response.data.return_message || 'Lỗi không xác định'));
        }
        const sandboxUrl = order_url.replace('qcgateway.zalopay.vn', 'sbgateway.zalopay.vn');
        setAppTransId(app_trans_id);
        const supported = await Linking.canOpenURL(sandboxUrl);
        if (supported) {
          await Linking.openURL(sandboxUrl);
        } else {
          setPaymentUrl(sandboxUrl);
          setUseWebView(true);
        }
      } catch (error) {
        console.error('Lỗi khi tạo link ZaloPay:', error.response?.data || error.message);
        Alert.alert('Lỗi', 'Không thể khởi tạo thanh toán ZaloPay: ' + (error.response?.data?.return_message || error.message));
      }
    } else {
      Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán.');
    }
  };

  if (useWebView && paymentUrl) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
        <WebView
          source={{ uri: paymentUrl }}
          style={{ flex: 1 }}
          onNavigationStateChange={(navState) => {
            console.log('WebView URL:', navState.url);
            if (navState.url.includes('success') || !navState.loading) {
              setPaymentUrl(null);
              setUseWebView(false);
              if (appTransId) {
                checkStatus(appTransId);
              } else {
                Alert.alert('Lỗi', 'Không tìm thấy app_trans_id để kiểm tra trạng thái.');
              }
            } else if (navState.url.includes('error') || navState.url.includes('fail')) {
              setPaymentUrl(null);
              setUseWebView(false);
              Alert.alert('Thất bại', 'Thanh toán ZaloPay thất bại.');
            }
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            setPaymentUrl(null);
            setUseWebView(false);
            Alert.alert('Lỗi', 'Không thể tải trang thanh toán ZaloPay.');
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Thanh toán đơn hàng #{rental?.rentalId || 'N/A'}</Text>
        </View>
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
        {rentalStatus !== 'confirmed' && (
          <View style={styles.statusSection}>
            <Text style={styles.statusText}>
              Đơn hàng đang chờ chủ xe chấp nhận. Vui lòng chờ xác nhận để tiếp tục thanh toán.
            </Text>
          </View>
        )}
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