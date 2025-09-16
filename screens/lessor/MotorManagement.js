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
      setMotors(Array.isArray(response.data) ? response.data : []);
      Animated.timing(refreshAnim, {
        toValue: 1,
        duration: 400,
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
        return { backgroundColor: '#FFD700', color: '#1A1A1A' };
      case 'approved':
        return { backgroundColor: '#10B981', color: '#FFFFFF' };
      case 'rejected':
        return { backgroundColor: '#EF4444', color: '#FFFFFF' };
      case 'rented':
        return { backgroundColor: '#3B82F6', color: '#FFFFFF' };
      case 'available':
        return { backgroundColor: '#34D399', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
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
      case 'rented':
        return 'Đang cho thuê';
      case 'available':
        return 'Có sẵn';        
      default:
        return 'Không rõ';
    }
  };

  const handleAddMotor = () => {
    navigation.navigate('AddMotorbike');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderMotorItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {item.imageUrl?.length > 0 ? (
          <Image source={{ uri: item.imageUrl[0] }} style={styles.bikeImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={48} color="#9CA3AF" />
            <Text style={styles.placeholderText}>Không có ảnh</Text>
          </View>
        )}
      </View>
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
      <View style={styles.licenseImageRow}>
        {item.licensePlate?.length > 0 ? (
          item.licensePlate.slice(0, 2).map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.licenseImage} />
          ))
        ) : (
          <View style={styles.placeholderLicense}>
            <Ionicons name="document-outline" size={32} color="#9CA3AF" />
            <Text style={styles.placeholderText}>Không có giấy tờ</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => navigation.navigate('MotorDetail', { motorId: item.bikeId })}
        activeOpacity={0.8}
      >
        <Text style={styles.viewButtonText} onPress={() => navigation.navigate('MotorDetail', { motorId: item.bikeId })}>Xem chi tiết</Text>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={60} color="#10B981" />
          <Text style={styles.loadingText}>Đang tải danh sách xe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchMotors}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={28} color="#1F2A44" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddMotor} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={28} color="#10B981" />
            <Text style={styles.headerButtonText}>Thêm xe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={fetchMotors} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ rotate: refreshAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
              <Ionicons name="refresh" size={28} color="#10B981" />
            </Animated.View>
            <Text style={styles.headerButtonText}>Làm mới</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>Quản lý xe thông minh</Text>
        <Text style={styles.motorCount}>{motors.length} xe</Text>
      </View>
      {motors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={100} color="#9CA3AF" />
          <Text style={styles.emptyText}>Chưa có xe nào được đăng ký</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddMotor} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2A44',
    letterSpacing: 0.5,
  },
  subtitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4B5563',
  },
  motorCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  bikeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 8,
  },
  infoContainer: {
    marginBottom: 12,
  },
  bikeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  bikeInfo: {
    fontSize: 16,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 24,
  },
  licenseImageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  licenseImage: {
    width: 100,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeholderLicense: {
    width: 100,
    height: 70,
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
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2A44',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
  retryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4B5563',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
});