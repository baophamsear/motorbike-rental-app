import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    Modal,
    Alert,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuthApi } from '../../utils/useAuthApi';
import { endpoints } from '../../configs/APIs';
import { useNavigation } from '@react-navigation/native';
import { useWebSocket } from '../../utils/useWebSocket';
import { topics } from '../../utils/topics';
import jwtDecode from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyBookingsScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [modalAction, setModalAction] = useState(null);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [rental, setRental] = useState([]);
    const [renterId, setRenterId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0)); // Animation cho modal

    const confirmedRental = renterId ? topics.renter.confirmRental(renterId) : null;
    const canceledRental = renterId ? topics.renter.cancelRental(renterId) : null;
    const { messages: messagesConfirmedRental } = useWebSocket(confirmedRental);
    const { messages: messagesCanceledRental } = useWebSocket(canceledRental);

    const navigation = useNavigation();

    const fetchUserId = async () => {
        try {
            const token = await AsyncStorage.getItem('access-token');
            if (token) {
                const decoded = jwtDecode(token);
                setRenterId(decoded.userId);
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy token');
            }
        } catch (err) {
            Alert.alert('Lỗi', 'Lỗi khi giải mã token: ' + err.message);
        }
    };

    const fetchMyRentals = async () => {
        try {
            const api = await getAuthApi();
            const res = await api.get(endpoints['getMyRental']);
            setRental(res.data);
        } catch (error) {
            console.error("Error fetching rentals:", error);
            Alert.alert('Lỗi', 'Không thể tải danh sách yêu cầu thuê xe');
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMyRentals();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        console.log("📬 Messages CreateRental:", messagesConfirmedRental);
        if (
            (messagesConfirmedRental && messagesConfirmedRental.length > 0) ||
            (messagesCanceledRental && messagesCanceledRental.length > 0)
        ) {
            fetchMyRentals();
        }
    }, [messagesConfirmedRental, messagesCanceledRental, renterId]);

    useEffect(() => {
        fetchMyRentals();
        fetchUserId();
    }, []);

    const handleAction = (requestId, action) => {
        setSelectedRequestId(requestId);
        setModalAction(action);
        setModalVisible(true);
        // Bắt đầu animation cho modal
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleDetailPress = (rental) => {
        navigation.navigate('BookingDetail', { rental });
    };

    const closeModal = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setModalVisible(false));
    };

    const renderRequestItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => handleDetailPress(item)}
            style={styles.requestCard}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.cardGradient}
            >
                <Image
                    source={require("../../assets/images/motor-rental-icon-svg.png")}
                    style={styles.bikeImage}
                    resizeMode="cover"
                />
                <View style={styles.requestDetails}>
                    <View style={styles.headerRow}>
                        <Text style={styles.orderId}>Mã đơn: {item.rentalId}</Text>
                        <Text style={styles.price}>
                            {item.rentalContract.bike.pricePerDay.toLocaleString('vi-VN')} VNĐ/ngày
                        </Text>
                    </View>
                    <Text style={styles.bikeName}>{item.rentalContract.bike.name}</Text>
                    <Text style={styles.date}>
                        Ngày thuê: {new Date(item.startDate).toLocaleDateString('vi-VN')} -{' '}
                        {new Date(item.endDate).toLocaleDateString('vi-VN')}
                    </Text>
                    <Text style={styles.address}>
                        Địa chỉ: {item.rentalContract?.location?.address || 'N/A'}
                    </Text>
                    <View
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor:
                                    item.status === 'pending'
                                        ? '#FEF3C7'
                                        : item.status === 'confirmed'
                                        ? '#D1FAE5'
                                        : item.status === 'cancelled'
                                        ? '#FEE2E2'
                                        : item.status === 'active'
                                        ? '#DBEAFE'
                                        : item.status === 'completed'
                                        ? '#D1FAE5' 
                                        : '#FEE2E2',
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.status,
                                {
                                    color:
                                        item.status === 'pending'
                                            ? '#D97706'
                                            : item.status === 'confirmed'
                                            ? '#059669' 
                                            : item.status === 'cancelled'
                                            ? '#DC2626'
                                            : item.status === 'confirmed'
                                            ? '#2563EB'
                                            : item.status === 'active'
                                            ? '#2563EB'
                                            : item.status === 'completed'
                                            ? '#16A34A'
                                            : '#6B7280',
                                },
                            ]}
                        >
                            {item.status === 'pending'
                                ? 'Đang chờ duyệt'
                                : item.status === 'confirmed'
                                ? 'Đã xác nhận'
                                : item.status === 'cancelled'
                                ? 'Đã hủy'
                                : item.status === 'active'
                                ? 'Đang thuê'
                                : item.status === 'completed'
                                ? 'Hoàn thành'
                                : item.status}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Yêu cầu thuê xe</Text>
            </LinearGradient>
            <FlatList
                data={rental}
                renderItem={renderRequestItem}
                keyExtractor={(item) => item.rentalId.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bicycle-outline" size={48} color="#6B7280" />
                        <Text style={styles.emptyText}>Chưa có yêu cầu thuê xe nào.</Text>
                    </View>
                }
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
            <Modal
                animationType="none"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>
                            {modalAction === 'accept' ? 'Xác nhận yêu cầu' : 'Hủy yêu cầu'}
                        </Text>
                        <Text style={styles.modalText}>
                            Bạn có chắc muốn{' '}
                            {modalAction === 'accept' ? 'xác nhận' : 'hủy'} yêu cầu này?
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={closeModal}
                            >
                                <Text style={styles.modalButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <LinearGradient
                                colors={['#4CAF50', '#2E7D32']}
                                style={styles.modalConfirmButton}
                            >
                                <TouchableOpacity onPress={() => { /* Xử lý hành động */ closeModal(); }}>
                                    <Text style={styles.modalButtonText}>Xác nhận</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    </View>
                </Animated.View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    header: {
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    listContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    requestCard: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    cardGradient: {
        flexDirection: 'row',
        padding: 16,
    },
    bikeImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginRight: 16,
    },
    requestDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2A44',
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF5722',
    },
    bikeName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2A44',
        marginBottom: 6,
    },
    date: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    address: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    status: {
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2A44',
        marginBottom: 16,
    },
    modalText: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    modalConfirmButton: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    modalCancelButton: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default MyBookingsScreen;