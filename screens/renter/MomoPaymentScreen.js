// MomoPaymentScreen.js
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { endpoints } from '../../configs/APIs';
import { getAuthApi } from '../../utils/useAuthApi';

export default function MomoPaymentScreen({ route, navigation }) {
    const { orderId, amount } = route.params;

    const simulatePayment = async () => {
        try {
            const api = await getAuthApi();
            const response = await api.post(endpoints['momoCallback'], {
                "orderId": orderId.toString(),
                "transId": "MOCK-TRANS-001",
                "amount": amount.toString(),
                "message": "Simulated payment success",
                "resultCode": 0,
                "orderInfo": "Thanh toán dịch vụ thuê xe",
            });

            alert("✅ Thanh toán thành công (giả lập)");
            navigation.goBack();
        } catch (error) {
            console.error("❌ Lỗi:", error.response?.data || error.message);
            alert("❌ Callback thất bại");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔐 MoMo Payment Simulation</Text>
            <Text style={styles.info}>Số tiền: {amount} VND</Text>
            <Text style={styles.info}>Mã đơn hàng: {orderId}</Text>

            <TouchableOpacity style={styles.button} onPress={simulatePayment}>
                <Text style={styles.buttonText}>Xác nhận thanh toán (Giả lập)</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    info: { fontSize: 16, marginBottom: 10 },
    button: {
        marginTop: 20,
        backgroundColor: '#e60f2d',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 8,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
