import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../../assets/styles/motorManageStyles';
import APIs, { authApis2, endpoints } from '../../configs/APIs';
import { getAuthApi } from '../../utils/useAuthApi';

export default function MotorManagement() {
  const [motors, setMotors] = useState([]);

  const fetchMotors = async () => {
    try {
      const api = await getAuthApi();
      const response = await api.get(endpoints['myMotor']);
      console.log("Fetched motors:", response.data);
      setMotors(response.data);
    } catch (error) {
      console.error("Error fetching motors:", error);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { backgroundColor: '#fef3c7', color: '#92400e' }; // vàng nhạt + nâu
      case 'approved':
        return { backgroundColor: '#d1fae5', color: '#065f46' }; // xanh lá nhạt + đậm
      case 'rejected':
        return { backgroundColor: '#fee2e2', color: '#991b1b' }; // đỏ nhạt + đậm
      default:
        return { backgroundColor: '#e5e7eb', color: '#374151' }; // xám nhạt
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Đang chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Bị từ chối';
      default:
        return 'Không rõ';
    }
  };



  useEffect(() => {
    fetchMotors();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      

      <Text style={styles.pageTitle}>YoMotor</Text>
      <Text style={styles.subtitle}>Quản lý xe thông minh</Text>

      <FlatList
        data={motors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16, margin: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Ảnh xe - lấy ảnh đầu tiên */}
            {item.imageUrl?.length > 0 && (
              <Image source={{ uri: item.imageUrl[0] }} style={styles.bikeImage} />
            )}

            

            {/* Tên xe */}
            <View style={styles.bikeInfoContainer}>
              <Text style={styles.bikeName}>{item.name}</Text>

              <Text style={[styles.status, getStatusStyle(item.status)]}>
                {item.status ? getStatusLabel(item.status) : 'UNKNOWN'}
              </Text>
            </View>
            

            {/* Hãng xe và địa điểm */}
            <Text style={styles.bikeInfo}>
              Hãng: {item.brand?.name} | Địa điểm: {item.location?.name}
            </Text>

            {/* Ảnh giấy tờ */}
            <View style={styles.licenseImageRow}>
              {item.licensePlate?.slice(0, 2).map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.licenseImage} />
              ))}
            </View>

            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewText}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>
        )}

      />
    </SafeAreaView>
  );
}
