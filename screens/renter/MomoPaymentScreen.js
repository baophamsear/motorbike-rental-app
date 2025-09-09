import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { endpoints } from '../../configs/APIs';
import { getAuthApi } from '../../utils/useAuthApi';

export default function MomoPaymentScreen({ route, navigation }) {
    const { orderId, amount } = route.params || {};
    const [isLoading, setIsLoading] = useState(false);

    const simulatePayment = async () => {
        setIsLoading(true);
        try {
            const api = await getAuthApi();
            const response = await api.post(endpoints['momoCallback'], {
                orderId: orderId?.toString() || 'unknown',
                transId: 'MOCK-TRANS-001',
                amount: amount?.toString() || '0',
                message: 'Simulated payment success',
                resultCode: 0,
                orderInfo: 'Thanh toán dịch vụ thuê xe',
            });
            console.log('MoMo callback response:', response.data);
            const rentalId = route.params.orderId;
            
            Alert.alert('Thành công', 'Thanh toán thành công (giả lập)', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);


            const res = await api.patch(endpoints.updateActiveRental(rentalId), {
                startDate: route.params.startDate,
                endDate: route.params.endDate,
                totalAmount: route.params.amount,
            });


        } catch (error) {
            console.error('Lỗi khi gọi MoMo callback:', error.response?.data || error.message);
            Alert.alert('Lỗi', 'Thanh toán thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F2A44" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Thanh toán MoMo</Text>
                </View>

                {/* MoMo Branding */}
                <View style={styles.brandingSection}>
                    <Ionicons name="wallet" size={48} color="#E60F2D" style={styles.brandIcon} />
                    <Text style={styles.brandText}>Thanh toán qua MoMo</Text>
                </View>

                {/* Payment Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Mã đơn hàng:</Text>
                        <Text style={styles.value}>{orderId || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Số tiền:</Text>
                        <Text style={[styles.value, styles.amountText]}>{formatCurrency(amount)} VNĐ</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Nội dung:</Text>
                        <Text style={styles.value}>Thanh toán dịch vụ thuê xe</Text>
                    </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                    style={[styles.confirmButton, isLoading && styles.disabledButton]}
                    onPress={simulatePayment}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.confirmButtonText}>Xác nhận thanh toán</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const formatCurrency = (value) => {
    if (!value) return '0';
    return value.toLocaleString('vi-VN');
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9F9FB',
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2A44',
        flex: 1,
        textAlign: 'center',
    },
    brandingSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    brandIcon: {
        marginBottom: 8,
    },
    brandText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#E60F2D',
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
    amountText: {
        color: '#FF5722',
    },
    confirmButton: {
        backgroundColor: '#E60F2D',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#F87171',
        opacity: 0.7,
    },
    confirmButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});