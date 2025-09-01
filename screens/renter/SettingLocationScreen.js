// ✅ Phiên bản hoàn thiện của SettingLocationScreen.js
// ❌ Đã loại bỏ SDK "react-native-vnpay-merchant"
// ✅ Sử dụng WebView để xử lý thanh toán VNPay

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
  Linking
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthApi } from "../../utils/useAuthApi";
import jwt_decode from "jwt-decode";
import { useNavigation } from '@react-navigation/native';

export default function SettingLocationScreen({ route }) {
  const { ownerLocation, contract } = route.params;
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [renterId, setRenterId] = useState(null);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const navigation = useNavigation();

  const paymentMethods = ['Momo', 'VNPay'];

  const fetchUser = async () => {
    const token = await AsyncStorage.getItem('access-token');
    const decoded = jwt_decode(token);
    setRenterId(decoded.userId);
  };

  useEffect(() => {
    fetchUser();
  }, [contract]);

  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getDays = (start, end) => {
    const startNorm = normalizeDate(start);
    const endNorm = normalizeDate(end);
    return Math.ceil((endNorm - startNorm) / (1000 * 60 * 60 * 24));
  };

  const formatCurrency = (value) => {
    if (!value) return "0 VNĐ";
    return value.toLocaleString("vi-VN") + " VNĐ";
  };

  const createRental = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Lỗi", "Vui lòng chọn ngày bắt đầu và kết thúc.");
      return;
    }

    const days = getDays(startDate, endDate);
    if (days <= 0) {
      Alert.alert("Lỗi", "Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    const totalPrice = contract?.bike?.pricePerDay * days;

    if (selectedPaymentMethod === "VNPay") {
      try {
        const api = await getAuthApi();
        const response = await api.get(endpoints['createVNPay'], {

          params: {
            amount: totalPrice,
            orderInfo: `Thanh toan hop dong #${contract.contractId}`,
            bankCode: "NCB"
          }
        });
        console.log("VNPay response:", response.data);

        const paymentUrl = response.data.paymentUrl;
        console.log("VNPay payment URL:", paymentUrl);
        navigation.navigate("VNPayWeb", {
          paymentUrl,
          onSuccess: () => {
            createRentalAPI(totalPrice);
            console.log("Thanh toán VNPay thành công");
          },

        });
      } catch (error) {
        console.error("Lỗi khi tạo link VNPay:", error);
        Alert.alert("Không thể khởi tạo thanh toán VNPay.");
      }
    } else if (selectedPaymentMethod === "Momo") {
      try {
        const rentalId = await createRentalAPI(); // ✅ nhận rentalId rõ ràng

        console.log("Momo payment created:", rentalId);
        console.log("Số tiền thanh toán:", totalPrice);

        navigation.navigate("MomoPayment", {
          orderId: rentalId,
          amount: totalPrice
        });

      } catch (error) {
        console.error("❌ Lỗi khi xử lý MoMo:", error.response?.data || error.message);
        Alert.alert("Không thể khởi tạo thanh toán MoMo.");
      }
    } else {
      // createRentalAPI(totalPrice);
    }


  };

  const createRentalAPI = async () => {
    const totalPrice = contract?.bike?.pricePerDay * getDays(startDate, endDate);

    try {
      const api = await getAuthApi();
      const res = await api.post(endpoints['createRental'], {
        contractId: contract.contractId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalPrice: totalPrice,
        renterId: renterId
      });

      const rentalId = res.data?.rentalId;

      if (rentalId) {
        setOrderId(rentalId);
        Alert.alert("Thành công", `Bạn đã đặt xe thành công!\nMã đơn: ${rentalId}`);
        return rentalId; // 💡 return lại để dùng trong hàm createRental
      } else {
        throw new Error("Không nhận được rentalId từ server.");
      }

    } catch (err) {
      console.error('❌ Lỗi khi tạo đơn thuê:', err.response?.data || err.message);
      Alert.alert("Lỗi", "Không thể tạo đơn thuê.");
      throw err; // để biết lỗi ở nơi gọi
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.header}>Thanh toán</Text>

        <View style={styles.card}>
          <Image source={{ uri: contract?.bike?.imageUrl?.[0] }} style={styles.image} />
          <View style={styles.cardInfo}>
            <Text style={styles.rating}>⭐ 4.8 (73)</Text>
            <Text style={styles.title}>{contract?.bike?.name}</Text>
            <Text style={styles.location}>Địa điểm: {contract?.bike?.location?.name}</Text>
            <Text style={styles.price}>{formatCurrency(contract?.bike?.pricePerDay)}<Text style={styles.per}>/ ngày</Text></Text>
          </View>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Chọn ngày</Text>
          <TouchableOpacity onPress={() => setIsStartOpen(true)} style={styles.dateButton}>
            <Text>Ngày bắt đầu: {startDate ? startDate.toLocaleDateString() : 'Chọn'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsEndOpen(true)} style={styles.dateButton}>
            <Text>Ngày kết thúc: {endDate ? endDate.toLocaleDateString() : 'Chọn'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionBox}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Chi tiết giá</Text>
            <Text style={styles.moreInfo}>{formatCurrency(contract?.bike?.pricePerDay)} / ngày</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Tổng giá</Text>
            <Text style={styles.priceValue}>{formatCurrency(contract?.bike?.pricePerDay * getDays(startDate, endDate))}</Text>
          </View>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          {paymentMethods.map((method, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSelectedPaymentMethod(method)}
              style={[styles.rowBetween, {
                backgroundColor: selectedPaymentMethod === method ? '#e0e7ff' : 'transparent',
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginBottom: 6
              }]}
            >
              <Text style={{
                fontWeight: selectedPaymentMethod === method ? 'bold' : 'normal',
                color: selectedPaymentMethod === method ? '#6C63FF' : '#000'
              }}>{method}</Text>
              <Text style={styles.plusIcon}>{selectedPaymentMethod === method ? '✓' : '＋'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.payButton} onPress={createRental}>
          <Text style={styles.payText}>Đặt xe</Text>
        </TouchableOpacity>

        <DatePicker
          modal
          mode="date"
          open={isStartOpen}
          date={startDate || new Date()}
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
    backgroundColor: '#F0F0F0'
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 1)',
    overflow: 'hidden',
  },
  image: {
    width: 150,
    height: 125,
  },
  cardInfo: {
    padding: 10,
    flex: 1,
  },
  rating: {
    fontSize: 14,
    color: '#888',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  location: {
    color: '#999',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  per: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#555',
  },
  sectionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  moreInfo: {
    color: '#6C63FF',
    fontSize: 14,
  },
  priceValue: {
    color: '#6C63FF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  plusIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  payButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  payText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});