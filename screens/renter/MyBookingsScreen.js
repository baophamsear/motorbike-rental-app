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


// Dữ liệu mẫu cho danh sách yêu cầu thuê xe


const MyBookingsScreen = () => {

    const [modalVisible, setModalVisible] = useState(false);
    const [modalAction, setModalAction] = useState(null);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [rental, setRental] = useState([]);
    const [renterId, setRenterId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);


    const confirmedRental = renterId ? topics.renter.confirmRental(renterId) : null;
    const canceledRental = renterId ? topics.renter.cancelRental(renterId) : null;
    const { messages: messagesConfirmedRental } = useWebSocket(confirmedRental);
    const { messages: messagesCanceledRental } = useWebSocket(canceledRental);

    const fetchUserId = async () => {
        try {
            const token = await AsyncStorage.getItem('access-token');
            if (token) {
                const decoded = jwtDecode(token);
                setRenterId(decoded.userId);
            } else {
                setError('Không tìm thấy token');
            }
        } catch (err) {
            setError('Lỗi khi giải mã token: ' + err.message);
        }
    };

    useEffect(() => {
        console.log("📬 Messages CreateRental:", messagesConfirmedRental);
        if (messagesConfirmedRental && messagesConfirmedRental.length > 0 ||
            (messagesCanceledRental && messagesCanceledRental.length > 0)
        ) {
            fetchMyRentals();
        }
    }, [messagesConfirmedRental, messagesCanceledRental, renterId]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMyRentals(); // load lại dữ liệu trang đầu
        setRefreshing(false);
    }, [fetchMyRentals]);



    const navigation = useNavigation();

    const handleAction = (requestId, action) => {
        setSelectedRequestId(requestId);
        setModalAction(action);
        setModalVisible(true);
    };

    const fetchMyRentals = async () => {
        try {
            const api = await getAuthApi();
            const res = await api.get(endpoints['getMyRental']);
            setRental(res.data);
        } catch (error) {
            console.error("Error fetching rentals:", error);
        }
    }

    const handleDetailPress = (rental) => {
        navigation.navigate('BookingDetail', { rental });
    }

    React.useEffect(() => {
        fetchMyRentals();
        fetchUserId();
    }, []);


    const renderRequestItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => handleDetailPress(item)}
            style={styles.requestCard}
        >
            <Image
                source={require("../../assets/images/motor-rental-icon-svg.png")}
                style={styles.bikeImage}
                resizeMode="cover"
            />
            <View style={styles.requestDetails}>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.orderId}>Order ID: {item.rentalId}</Text>
                    <Text style={styles.price}>
                        {item.rentalContract.bike.pricePerDay.toLocaleString('vi-VN')} VNĐ/ngày
                    </Text>
                </View>
                <Text style={styles.bikeName}>{item.rentalContract.bike.name}</Text>

                <Text
                    style={[
                        styles.status,
                        {
                            color:
                                item.status === 'pending'
                                    ? '#F59E0B'
                                    : item.status === 'Đã chấp nhận'
                                        ? '#4CAF50'
                                        : '#EF4444',
                        },
                    ]}
                >
                    Trạng thái: {item.status}
                </Text>

            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Yêu cầu thuê xe</Text>
            </View>
            <FlatList
                data={rental}
                renderItem={renderRequestItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Chưa có yêu cầu thuê xe nào.</Text>
                }
                refreshing={refreshing}       
                onRefresh={onRefresh}
            />


        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2A44',
        textAlign: 'center',
    },
    listContainer: {
        padding: 16,
    },
    requestCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    bikeImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    requestDetails: {
        flex: 1,
    },
    bikeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2A44',
        marginBottom: 4,
    },
    renterName: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
    },
    requestDate: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
    },
    price: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2A44',
        marginBottom: 4,
    },
    status: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    cancelButton: {
        backgroundColor: '#EF4444',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2A44',
        marginVertical: 12,
    },
    modalText: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 16,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    modalConfirmButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    modalCancelButton: {
        backgroundColor: '#EF4444',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default MyBookingsScreen;