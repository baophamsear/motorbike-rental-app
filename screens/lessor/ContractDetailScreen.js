import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Image,
    Dimensions,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapboxGL from '@rnmapbox/maps';
import { getAuthApi } from '../../utils/useAuthApi';
import { endpoints } from '../../configs/APIs';

// Replace with your MapBox access token
MapboxGL.setAccessToken('pk.eyJ1IjoiYmFvcGhhbTAxMTAiLCJhIjoiY21leTc3dmdvMWVoNTJrcHlvY29xODZkYSJ9.vnT3usPvz6o6c-7X10sSmw');

const { width } = Dimensions.get('window');

export default function ContractDetail() {
    const [contract, setContract] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fadeAnim] = useState(new Animated.Value(0)); // Animation for fade-in
    const navigation = useNavigation();
    const route = useRoute();
    const { contractId } = route.params;

    useEffect(() => {
        const fetchContractDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const api = await getAuthApi();
                if (!api) {
                    throw new Error('Không thể khởi tạo API client');
                }
                console.log('Fetching contract details for ID:', contractId);
                const response = await api.get(`${endpoints['getContractById'](contractId)}`);
                setContract(response.data);
                // Trigger fade-in animation
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            } catch (error) {
                console.error('Error fetching contract details:', error);
                setError('Không thể tải thông tin hợp đồng');
            } finally {
                setIsLoading(false);
            }
        };
        fetchContractDetails();
    }, [contractId, fadeAnim]);

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return { backgroundColor: '#FFD700', color: '#1A1A1A' };
            case 'approved':
                return { backgroundColor: '#10B981', color: '#FFFFFF' };
            case 'rejected':
                return { backgroundColor: '#EF4444', color: '#FFFFFF' };
            case 'available':
                return { backgroundColor: '#10B981', color: '#FFFFFF' };
            case 'rented':
                return { backgroundColor: '#3B82F6', color: '#FFFFFF' };
            case 'active':
                return { backgroundColor: '#3B82F6', color: '#FFFFFF' };
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
            case 'available':
                return 'Sẵn sàng';
            case 'rented':
                return 'Đang thuê';
            case 'active':
                return 'Đang hoạt động';
            default:
                return 'Không rõ';
        }
    };

    const getPaymentCycleLabel = (cycle) => {
        switch (cycle?.toLowerCase()) {
            case 'monthly':
                return 'Hàng tháng';
            case 'quarterly':
                return 'Hàng quý';
            case 'yearly':
                return 'Hàng năm';
            default:
                return cycle || 'Không rõ';
        }
    };

    const convertDateFormat = (dateString) => {
        if (!dateString) return 'Không rõ';
        const date = new Date(dateString);
        if (isNaN(date)) return 'Không rõ';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const handleEditContract = () => {
        navigation.navigate('ContractEdit', { contract });
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size={60} color="#10B981" />
                    <Text style={styles.loadingText}>Đang tải thông tin hợp đồng...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !contract) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
                    <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin hợp đồng'}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleBack}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.retryButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const longitude = parseFloat(contract?.location?.longitude);
    const latitude = parseFloat(contract?.location?.latitude);

    const coordinates =
        !isNaN(longitude) && !isNaN(latitude)
            ? [longitude, latitude] // [lng, lat] cho Mapbox
            : [106.699396, 10.678586]; // fallback mặc định
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={28} color="#1F2A44" />
                </TouchableOpacity>
                <Text style={styles.pageTitle}>Chi tiết hợp đồng</Text>
                {contract.status?.toLowerCase() === 'approved' && (
                    <TouchableOpacity style={styles.editButton} onPress={handleEditContract} activeOpacity={0.8}>
                        <Ionicons name="pencil" size={24} color="#10B981" />
                        <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                    </TouchableOpacity>
                )}
            </View>
            <Animated.View style={[styles.scrollContainer, { opacity: fadeAnim }]}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.infoContainer}>
                        <Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Mã hợp đồng:</Text>
                            <Text style={styles.value}>{contract.contractId || 'Không rõ'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Trạng thái:</Text>
                            <View style={[styles.statusBadge, getStatusStyle(contract.status)]}>
                                <Text style={[styles.statusText, { color: getStatusStyle(contract.status).color }]}>
                                    {getStatusLabel(contract.status)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Chủ xe:</Text>
                            <Text style={styles.value}>{contract.lessor?.fullName || 'Không rõ'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Giá chiết khấu:</Text>
                            <Text style={styles.value}>
                                {contract.serviceFee ? `${contract.serviceFee.toLocaleString('vi-VN')} VND` : 'Không rõ'}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Ngày bắt đầu:</Text>
                            <Text style={styles.value}>{convertDateFormat(contract.startDate) || 'Không rõ'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Ngày kết thúc:</Text>
                            <Text style={styles.value}>{convertDateFormat(contract.endDate) || 'Không rõ'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Chu kỳ thanh toán:</Text>
                            <Text style={styles.value}>{getPaymentCycleLabel(contract.paymentCycle)}</Text>
                        </View>
                    </View>
                    <View style={styles.bikeContainer}>
                        <Text style={styles.sectionTitle}>Thông tin xe</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Tên xe:</Text>
                            <Text style={styles.value}>{contract.bike?.name || 'Không rõ'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Hãng:</Text>
                            <Text style={styles.value}>{contract.bike?.brand?.name || 'Không rõ'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Giá thuê/ngày:</Text>
                            <Text style={styles.value}>
                                {contract.bike?.pricePerDay ? `${contract.bike.pricePerDay.toLocaleString('vi-VN')} VND` : 'Không rõ'}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Trạng thái xe:</Text>
                            <View style={[styles.statusBadge, getStatusStyle(contract.bike?.status)]}>
                                <Text style={[styles.statusText, { color: getStatusStyle(contract.bike?.status).color }]}>
                                    {getStatusLabel(contract.bike?.status)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.imageContainer}>
                        <Text style={styles.sectionTitle}>Hình ảnh xe</Text>
                        {contract.bike?.imageUrl?.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                {contract.bike.imageUrl.map((uri, index) => (
                                    <Image key={index} source={{ uri }} style={styles.bikeImage} />
                                ))}
                            </ScrollView>
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                                <Text style={styles.placeholderText}>Không có ảnh</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.imageContainer}>
                        <Text style={styles.sectionTitle}>Giấy tờ xe</Text>
                        {contract.bike?.licensePlate?.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                {contract.bike.licensePlate.map((uri, index) => (
                                    <Image key={index} source={{ uri }} style={styles.licenseImage} />
                                ))}
                            </ScrollView>
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                                <Text style={styles.placeholderText}>Không có giấy tờ</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.mapContainer}>
                        <Text style={styles.sectionTitle}>Vị trí hợp đồng</Text>
                        <MapboxGL.MapView
                            style={styles.map}
                            styleURL={MapboxGL.StyleURL.Street}
                            zoomLevel={15}
                            centerCoordinate={coordinates}
                        >
                            <MapboxGL.PointAnnotation
                                id="contractLocation"
                                coordinate={coordinates}
                                title={contract.location?.address || 'Vị trí hợp đồng'}
                            >
                                <View style={styles.marker}>
                                    <Ionicons name="location" size={24} color="#EF4444" />
                                </View>
                            </MapboxGL.PointAnnotation>
                        </MapboxGL.MapView>
                        <Text style={styles.mapText}>{contract.location?.address || 'Không rõ'}</Text>
                    </View>
                    {contract.status?.toLowerCase() === 'pending' && (
                        <View style={styles.noticeBox}>
                            <Ionicons name="alert-circle-outline" size={24} color="#FFD700" />
                            <Text style={styles.noticeText}>
                                Hợp đồng đang chờ duyệt. Vui lòng khởi tạo để bắt đầu hoạt động.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </Animated.View>
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
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2A44',
        letterSpacing: 0.5,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10B981',
        marginLeft: 8,
    },
    scrollContainer: {
        marginTop: 18,
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    infoContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    bikeContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    imageContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    mapContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2A44',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4B5563',
        flex: 1,
    },
    value: {
        fontSize: 16,
        fontWeight: '400',
        color: '#1F2A44',
        flex: 2,
        textAlign: 'right',
    },
    statusBadge: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    imageScroll: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    bikeImage: {
        width: width * 0.6,
        height: 220,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    licenseImage: {
        width: width * 0.4,
        height: 140,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    placeholderImage: {
        width: '100%',
        height: 220,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    placeholderText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#9CA3AF',
        marginTop: 8,
    },
    map: {
        height: 280,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    marker: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 6,
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    mapText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4B5563',
        textAlign: 'center',
    },
    noticeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    noticeText: {
        fontSize: 16,
        color: '#92400E',
        marginLeft: 8,
        flex: 1,
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
        paddingHorizontal: 24,
        marginTop: 16,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});