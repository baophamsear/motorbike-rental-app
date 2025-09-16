import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuthApi } from '../../utils/useAuthApi';
import { endpoints } from '../../configs/APIs';

export default function ContractManagement() {
  const navigation = useNavigation();
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshAnim] = useState(new Animated.Value(0));

  const fetchContracts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const api = await getAuthApi();
      const response = await api.get(endpoints['myContracts']);
      console.log('Fetched contracts:', response.data);
      setContracts(Array.isArray(response.data) ? response.data : []);
      Animated.timing(refreshAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => refreshAnim.setValue(0));
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError('Không thể tải danh sách hợp đồng');
    } finally {
      setIsLoading(false);
    }
  }, [refreshAnim]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { backgroundColor: '#FFD700', color: '#1A1A1A' };
      case 'approved':
        return { backgroundColor: '#10B981', color: '#FFFFFF' };
      case 'rejected':
        return { backgroundColor: '#EF4444', color: '#FFFFFF' };
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
      default:
        return 'Không rõ';
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderItem = ({ item }) => {
    const { contractId, lessor, bike, serviceFee, startDate, endDate, status } = item;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="contract-outline" size={24} color="#10B981" />
            <Text style={styles.contractId}>Mã hợp đồng: {contractId}</Text>
          </View>
          <View style={[styles.statusBadge, getStatusStyle(status)]}>
            <Text style={[styles.statusText, { color: getStatusStyle(status).color }]}>
              {getStatusLabel(status)}
            </Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagContainer}>
          <View style={[styles.tag, { backgroundColor: '#10B981' }]}>
            <Text style={styles.tagText}>{bike?.brand?.name || 'Không rõ'}</Text>
          </View>
        </View>

        {/* Amount */}
        <Text style={styles.amount}>
          Giá chiết khấu: <Text style={styles.amountBold}>{serviceFee?.toLocaleString('vi-VN')} VND</Text>
        </Text>

        <View style={styles.divider} />

        {/* Info rows */}
        <View style={styles.infoRow}>
          <Ionicons name="person-circle-outline" size={20} color="#10B981" />
          <Text style={styles.infoText}>Chủ xe: {bike?.owner?.fullName || 'Không rõ'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            {startDate} - {endDate}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#10B981" />
          <Text style={styles.infoText}>{bike?.location?.name || 'Không rõ'}</Text>
        </View>

        {/* Notice for pending */}
        {status?.toLowerCase() === 'pending' && (
          <View style={styles.noticeBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#FFD700" />
            <Text style={styles.noticeText}>
              Cần khởi tạo hợp đồng để bắt đầu hoạt động.
            </Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {status?.toLowerCase() === 'pending' ? (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('ContractEdit', { contract: item })}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Cập nhật hợp đồng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('ContractDetail', { contractId })}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Xem chi tiết</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton, styles.fullWidthButton]}
              onPress={() => navigation.navigate('ContractDetail', { contractId })}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Xem chi tiết</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={60} color="#10B981" />
          <Text style={styles.loadingText}>Đang tải danh sách hợp đồng...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchContracts} activeOpacity={0.8}>
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
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={28} color="#1F2A44" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý hợp đồng</Text>
        <TouchableOpacity onPress={fetchContracts} activeOpacity={0.8}>
          <Animated.View style={{ transform: [{ rotate: refreshAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
            <Ionicons name="refresh" size={28} color="#10B981" />
          </Animated.View>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>{contracts.length} hợp đồng</Text>

      {/* Danh sách hợp đồng */}
      {contracts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={100} color="#9CA3AF" />
          <Text style={styles.emptyText}>Chưa có hợp đồng nào</Text>
        </View>
      ) : (
        <FlatList
          data={contracts}
          renderItem={renderItem}
          keyExtractor={(item) => item.contractId.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2A44',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4B5563',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contractId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2A44',
    marginLeft: 8,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  amount: {
    fontSize: 18,
    color: '#1F2A44',
    marginBottom: 12,
  },
  amountBold: {
    fontWeight: '700',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 8,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#1F2A44',
  },
  fullWidthButton: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
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
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4B5563',
    marginTop: 16,
    textAlign: 'center',
  },
});