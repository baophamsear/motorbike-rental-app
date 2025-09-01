import React from 'react';
import { WebView } from 'react-native-webview';
import { Alert } from 'react-native';

export default function VNPayWebScreen({ route, navigation }) {
  const { paymentUrl } = route.params;

  const handleNavigationChange = (navState) => {
    const { url } = navState;
    

    if (url.includes('vnp_ResponseCode')) {
      const params = new URLSearchParams(url.split('?')[1]);
      const responseCode = params.get('vnp_ResponseCode');

      if (responseCode === '00') {
        Alert.alert("✅ Thanh toán thành công!");
      } else {
        Alert.alert("❌ Thanh toán thất bại hoặc bị huỷ.");
      }

      // navigation.goBack(); // quay lại màn trước
    }
  };

  return (
    <WebView
      source={{ uri: paymentUrl }}
      onNavigationStateChange={handleNavigationChange}
      startInLoadingState
    />
  );
}
