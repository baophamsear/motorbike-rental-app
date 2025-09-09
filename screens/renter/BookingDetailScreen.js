import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Các bước tiến độ đơn hàng
const progressSteps = [
  { label: 'Đã gửi đơn', icon: 'paper-plane', completedStatus: ['pending', 'confirmed', 'paid', 'shipped', 'delivered'] },
  { label: 'Chủ xe chấp nhận', icon: 'checkmark', completedStatus: ['confirmed', 'paid', 'shipped', 'delivered'] },
  { label: 'Thanh toán', icon: 'cash', completedStatus: ['paid', 'shipped', 'delivered'] },
  { label: 'Bắt đầu thuê', icon: 'bicycle', completedStatus: ['shipped', 'delivered'] },
  { label: 'Kết thúc thuê', icon: 'flag', completedStatus: ['delivered'] },
];

const BookingDetailScreen = ({ route }) => {
  const rental = route.params?.rental || {};
  const [rentalStatus, setRentalStatus] = useState(rental.status || 'pending');
  const navigation = useNavigation();

  useEffect(() => {
    // Cập nhật trạng thái khi rental thay đổi
    setRentalStatus(rental.status || 'pending');
  }, [rental.status]);

  const handlePayment = (item) => {
    navigation.navigate('PaymentBooking', { rental: item });
  }

  const isCompleted = (step) => step.completedStatus.includes(rentalStatus);
  const isConfirmed = rentalStatus === 'confirmed';

  // Xử lý dữ liệu từ rental
  const orderDetails = {
    orderId: rental.orderId || rental.rentalId || 'DH000000',
    date: rental.createdAt || 'N/A',
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
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Chi tiết đơn hàng {orderDetails.orderId}</Text>
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
              {rentalStatus === 'pending' ? 'Đang chờ duyệt' : rentalStatus.charAt(0).toUpperCase() + rentalStatus.slice(1)}
            </Text>
          </View>
        </View>

        {/* Các mục chỉ hiển thị khi trạng thái là confirmed */}
        {isConfirmed && (
          <>
            {/* Danh sách dịch vụ thuê */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dịch vụ thuê</Text>
              {orderDetails.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(item.price)}đ/ Ngày</Text>
                  </View>
                </View>
              ))}
            </View>

            

            {/* Nút hành động */}
            <TouchableOpacity style={styles.paymentButton} onPress={() => handlePayment(rental)}>
              <Text style={styles.buttonText}>Thanh toán</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Thông báo khi trạng thái là pending */}
        {rentalStatus === 'pending' && (
          <Text style={styles.pendingText}>Đang chờ người bán duyệt đơn hàng...</Text>
        )}
      </ScrollView>
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
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
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
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
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
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
  trackButton: {
    backgroundColor: '#6D28D9',
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
});

export default BookingDetailScreen;