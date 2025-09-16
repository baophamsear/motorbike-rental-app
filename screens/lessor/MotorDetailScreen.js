import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getAuthApi } from '../../utils/useAuthApi';
import APIs, { endpoints } from '../../configs/APIs';

export default function MotorDetail() {
    const [motor, setMotor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation();
    const route = useRoute();
    const { motorId } = route.params;

    useEffect(() => {
        const fetchMotorDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const api = await getAuthApi();
                if (!api) {
                    throw new Error('Không thể khởi tạo API client');
                }
                console.log('Fetching motor details for ID:', motorId);
                const response = await api.post(endpoints.getMotorById, { id: motorId });
                console.log('Motor details response:', response.data);
                setMotor(response.data);
            } catch (error) {
                console.error('Error fetching motor details:', error);
                setError('Không thể tải thông tin xe');
            } finally {
                setIsLoading(false);
            }
        };
        fetchMotorDetails();
    }, [motorId]);

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'rented':
                return { backgroundColor: '#FFD700', color: '#1A1A1A' };
            case 'approved':
                return { backgroundColor: '#10B981', color: '#FFFFFF' };
            case 'rejected':
                return { backgroundColor: '#EF4444', color: '#FFFFFF' };
            case 'pending':
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

    const handleBack = () => {
        navigation.goBack();
    };

    const handleEditMotor = () => {
        navigation.navigate('EditMotorbike', { motorId });
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size={60} color="#10B981" />
                    <Text style={styles.loadingText}>Đang tải thông tin xe...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !motor) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
                    <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin xe'}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.retryButtonText}>Quay lại</Text>
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
                <Text style={styles.pageTitle}>{'Chi tiết xe'}</Text>
                <TouchableOpacity style={styles.editButton} onPress={handleEditMotor} activeOpacity={0.8}>
                    <Ionicons name="pencil" size={24} color="#10B981" />
                    <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.imageContainer}>
                    {motor.imageUrl?.length > 0 ? (
                        <Image source={{ uri: motor.imageUrl[0] }} style={styles.bikeImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                            <Text style={styles.placeholderText}>Không có ảnh</Text>
                        </View>
                    )}
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.sectionTitle}>Thông tin xe</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Tên xe:</Text>
                        <Text style={styles.value}>{motor.name || 'Không rõ'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Trạng thái:</Text>
                        <View style={[styles.statusBadge, getStatusStyle(motor.status)]}>
                            <Text style={[styles.statusText, { color: getStatusStyle(motor.status).color }]}>
                                {motor.status ? getStatusLabel(motor.status) : 'Không rõ'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Hãng:</Text>
                        <Text style={styles.value}>{motor.brand?.name || 'Không rõ'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Địa điểm:</Text>
                        <Text style={styles.value}>{motor.location?.name || 'Không rõ'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Giá thuê:</Text>
                        <Text style={styles.value}>{motor.price ? `${motor.price.toLocaleString()} VND/ngày` : 'Không rõ'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Ngày đăng ký:</Text>
                        <Text style={styles.value}>{motor.registrationDate || 'Không rõ'}</Text>
                    </View>
                </View>
                <View style={styles.licenseContainer}>
                    <Text style={styles.sectionTitle}>Giấy tờ xe</Text>
                    <View style={styles.licenseImageRow}>
                        {motor.licensePlate?.length > 0 ? (
                            motor.licensePlate.map((uri, index) => (
                                <Image key={index} source={{ uri }} style={styles.licenseImage} />
                            ))
                        ) : (
                            <View style={styles.placeholderLicense}>
                                <Ionicons name="document-outline" size={32} color="#9CA3AF" />
                                <Text style={styles.placeholderText}>Không có giấy tờ</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
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
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#F3F4F6',
    },
    bikeImage: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: 250,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2A44',
        marginBottom: 12,
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
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    licenseContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    licenseImageRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    licenseImage: {
        width: 120,
        height: 80,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    placeholderLicense: {
        width: 120,
        height: 80,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
});