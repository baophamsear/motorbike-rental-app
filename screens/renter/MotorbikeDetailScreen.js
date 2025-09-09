import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuthApi } from '../../utils/useAuthApi';
import { endpoints } from '../../configs/APIs';
import jwt_decode from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MotorbikeDetailScreen({ route }) {
    const contract = route.params?.contract;
    const bike = contract?.bike;
    const nav = useNavigation();

    const latitude = contract?.location?.latitude || 10.762622;
    const longitude = contract?.location?.longitude || 106.660172;

    const [modalVisible, setModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [renterId, setRenterId] = useState(null);

    useEffect(() => {
        fetchUser();
    }, [contract]);

    const handleBooking = () => {
        setIsLoading(true);
        setModalVisible(true);
        // Giả lập xử lý đặt xe trong 2 giây
        setTimeout(() => {
            setIsLoading(false);
        }, 2000);
    };

    const fetchUser = async () => {
        const token = await AsyncStorage.getItem('access-token');
        const decoded = jwt_decode(token);
        setRenterId(decoded.userId);
    };

    const handleCreateRental = async () => {
        try {
            const api = await getAuthApi();
            const res = await api.post(endpoints['createRental'], {
                contractId: contract.contractId,
                renterId: renterId
            });
        } catch (err) {
            console.error('❌ Lỗi khi tạo đơn thuê:', err.response?.data || err.message);
            Alert.alert("Lỗi", "Không thể tạo đơn thuê.");
            throw err; // để biết lỗi ở nơi gọi
        }
    };




    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                {/* Image Section */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: bike?.imageUrl?.[0] || 'https://example.com/bike.jpg' }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)']}
                        style={styles.imageGradient}
                    />
                    <TouchableOpacity style={styles.backButton} onPress={() => nav.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Title and Info Section */}
                <View style={styles.contentContainer}>
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>{bike?.name || 'Xe không tên'}</Text>
                        <TouchableOpacity>
                            <Ionicons name="heart-outline" size={28} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Ionicons name="star" size={18} color="#FACC15" />
                            <Text style={styles.infoText}>4.1 (66 đánh giá)</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="pricetag-outline" size={18} color="#555" />
                            <Text style={styles.infoText}>{bike?.brand?.name || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="location-outline" size={18} color="#555" />
                            <Text style={styles.infoText}>{bike?.location?.name || 'N/A'}</Text>
                        </View>
                    </View>

                    {/* Owner Section */}
                    <View style={styles.ownerSection}>
                        <Image
                            source={{ uri: bike?.owner?.avatarUrl || 'https://i.pravatar.cc/150?img=1' }}
                            style={styles.ownerAvatar}
                        />
                        <View style={styles.ownerInfo}>
                            <Text style={styles.ownerName}>{bike?.owner?.fullName || 'Unknown'}</Text>
                            <Text style={styles.ownerLabel}>Chủ xe</Text>
                        </View>
                        <TouchableOpacity style={styles.callButton}>
                            <Ionicons name="call-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Thông tin</Text>
                        <View style={styles.facilityItem}>
                            <Ionicons name="cash-outline" size={20} color="#6B7280" />
                            <Text style={styles.facilityText}>
                                Giá thuê: {bike?.pricePerDay ? `${bike.pricePerDay.toLocaleString('vi-VN')} VNĐ/ngày` : 'N/A'}
                            </Text>
                        </View>
                    </View>

                    {/* Map Section */}
                    <View style={styles.mapContainer}>
                        <MapboxGL.MapView
                            style={styles.map}
                            styleURL={MapboxGL.StyleURL.Street}
                            logoEnabled={false}
                        >
                            <MapboxGL.Camera
                                zoomLevel={14}
                                centerCoordinate={[longitude, latitude]}
                            />
                            <MapboxGL.PointAnnotation
                                id="bike-location"
                                coordinate={[longitude, latitude]}
                            />
                        </MapboxGL.MapView>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={styles.advanceButton}
                        // onPress={() => {
                        //   console.log('contract:', contract);
                        //   console.log('location:', [longitude, latitude]);
                        //   nav.navigate('SettingLocation', { ownerLocation: [longitude, latitude], contract });
                        // }}
                        onPress={() => {
                            handleBooking();
                            handleCreateRental();
                        }}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#45A049']}
                            style={styles.advanceButtonGradient}
                        >
                            <Text style={styles.advanceButtonText}>Đặt xe</Text>
                        </LinearGradient>
                    </TouchableOpacity>


                </View>
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {isLoading ? (
                            <>
                                <ActivityIndicator size="large" color="#4CAF50" />
                                <Text style={styles.modalText}>Đang xử lý đơn hàng...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                                <Text style={styles.modalTitle}>Đặt xe thành công!</Text>
                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.modalButtonText}>Đóng</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );

}


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
    },
    imageContainer: {
        position: 'relative',
        height: 250,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    contentContainer: {
        padding: 16,
    },
    titleSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2A44',
    },
    infoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontSize: 14,
        color: '#4B5563',
        marginLeft: 6,
    },
    ownerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    ownerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    ownerInfo: {
        flex: 1,
    },
    ownerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2A44',
    },
    ownerLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    callButton: {
        backgroundColor: '#6D28D9',
        borderRadius: 20,
        padding: 10,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2A44',
        marginBottom: 12,
    },
    facilityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    facilityText: {
        fontSize: 16,
        color: '#4B5563',
        marginLeft: 8,
    },
    mapContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    map: {
        flex: 1,
    },
    advanceButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    advanceButtonGradient: {
        padding: 16,
        alignItems: 'center',
    },
    advanceButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    testimonialCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    testimonialHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    testimonialAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    testimonialName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2A44',
    },
    rating: {
        flexDirection: 'row',
    },
    testimonialContent: {
        fontSize: 14,
        color: '#4B5563',
    },
    readMore: {
        color: '#6D28D9',
        fontWeight: '600',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    bottomPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2A44',
    },
    bottomSub: {
        fontSize: 14,
        color: '#6B7280',
    },
    contactButton: {
        backgroundColor: '#6D28D9',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    contactText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
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
    modalText: {
        fontSize: 18,
        color: '#1F2A44',
        marginTop: 16,
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2A44',
        marginVertical: 16,
    },
    modalButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 12,
        width: '100%',
        alignItems: 'center',
        marginTop: 12,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});