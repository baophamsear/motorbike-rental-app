import React from 'react';
import { WebView } from 'react-native-webview';
import { Alert } from 'react-native';

export default function MomoWebScreen({ route, navigation }) {
    const { momoUrl, onSuccess } = route.params;

    const handleNavigationChange = (navState) => {
        const { url } = navState;

        console.log("🔁 WebView URL:", url); // Ghi log để kiểm tra

        if (url.includes('resultCode')) {
            const params = new URLSearchParams(url.split('?')[1]);
            const resultCode = params.get('resultCode');

            if (resultCode === '0') {
                Alert.alert("✅ Thanh toán MoMo thành công!");
                onSuccess && onSuccess();
            } else {
                Alert.alert("❌ Thanh toán MoMo thất bại.");
            }

            setTimeout(() => navigation.goBack(), 100000);
        }
    };

    return (
        <WebView
            source={{ uri: momoUrl }}
            onNavigationStateChange={handleNavigationChange}
            startInLoadingState
        />
    );
}
