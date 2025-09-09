import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuthApi } from '../../utils/useAuthApi';
import APIs, { endpoints } from '../../configs/APIs';

export default function MotorManagement() {
  const [motors, setMotors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation();

  const fetchMotors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const api = await getAuthApi();
      if (!api) {
        throw new Error('Không thể khởi tạo API client');
      }
      const response = await api.get(endpoints['myMotor']);
      console.log('Fetched motors:', response.data);
      setMotors(Array.isArray(response.data) ? response.data : []);
      Animated.timing(refreshAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => refreshAnim.setValue(0));
    } catch (error) {
      console.error('Error fetching motors:', error);
      setError('Không thể tải danh sách xe');
    } finally {
      setIsLoading(false);
    }
  }, [refreshAnim]);

  useEffect(() => {
    fetchMotors();
  }, [fetchMotors]);

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { backgroundColor: '#FFCA28', color: '#1F2A44' };
      case 'approved':
        return { backgroundColor: '#22C55E', color: '#fff' };
      case 'rejected':
        return { backgroundColor: '#FF5722', color: '#fff' };
      default:
        return { backgroundColor: '#6B7280', color: '#fff' };
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

  const handleAddMotor = () => {
    console.log('Navigate to add motor screen');
    navigation.navigate('AddMotorbike'); // Uncomment when navigation is implemented
  };

  const renderMotorItem = ({ item }) => (
    <View style={styles.card}>
      {/* Ảnh xe */}
      <View style={styles.imageContainer}>
        {item.imageUrl?.length > 0 ? (
          <Image source={{ uri: item.imageUrl[0] }} style={styles.bikeImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#6B7280" />
            <Text style={styles.placeholderText}>Không có ảnh</Text>
          </View>
        )}
      </View>

      {/* Thông tin xe */}
      <View style={styles.infoContainer}>
        <Text style={styles.bikeName}>{item.name || 'Không rõ'}</Text>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={[styles.statusText, { color: getStatusStyle(item.status).color }]}>
            {item.status ? getStatusLabel(item.status) : 'Không rõ'}
          </Text>
        </View>
        <Text style={styles.bikeInfo}>
          Hãng: {item.brand?.name || 'Không rõ'} | Địa điểm: {item.location?.name || 'Không rõ'}
        </Text>
      </View>

      {/* Ảnh giấy tờ */}
      <View style={styles.licenseImageRow}>
        {item.licensePlate?.length > 0 ? (
          item.licensePlate.slice(0, 2).map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.licenseImage} />
          ))
        ) : (
          <View style={styles.placeholderLicense}>
            <Ionicons name="document-outline" size={24} color="#6B7280" />
            <Text style={styles.placeholderText}>Không có giấy tờ</Text>
          </View>
        )}
      </View>

      {/* Nút xem chi tiết */}
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => console.log('Navigate to motor detail:', item.motorId || item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.viewButtonText}>Xem chi tiết</Text>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải danh sách xe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF5722" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchMotors}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleAddMotor} activeOpacity={0.7}>
          <Ionicons name="add-circle" size={24} color="#4CAF50" />
          <Text style={styles.headerButtonText}>Thêm xe</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>YoMotor</Text>
        <TouchableOpacity style={styles.headerButton} onPress={fetchMotors} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ rotate: refreshAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
            <Ionicons name="refresh" size={24} color="#4CAF50" />
          </Animated.View>
          <Text style={styles.headerButtonText}>Làm mới</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Quản lý xe thông minh</Text>
        <Text style={styles.motorCount}>{motors.length} xe</Text>
      </View>

      {/* Danh sách xe */}
      {motors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={80} color="#6B7280" />
          <Text style={styles.emptyText}>Chưa có xe nào được đăng ký</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddMotor} activeOpacity={0.7}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Thêm xe mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={motors}
          keyExtractor={(item) => item.motorId?.toString() || item.id?.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={renderMotorItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 6,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2A44',
    letterSpacing: 0.5,
  },
  subtitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  motorCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    minHeight: 360, // Đảm bảo card có chiều cao cố định
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  bikeImage: {
    width: '100%',
    height: 180, // Chiếm ~50% chiều cao card
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
  },
  infoContainer: {
    marginBottom: 12,
    flex: 1,
  },
  bikeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  bikeInfo: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  licenseImageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  licenseImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeholderLicense: {
    width: 80,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2A44',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9FB',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF5722',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
});