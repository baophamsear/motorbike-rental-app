import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import styles from '../../styles/RegisterStyles';
import APIs, { endpoints } from '../../configs/APIs';

export default function Register() {
  const navigation = useNavigation();

  // Dữ liệu form
  const [form, setForm] = useState({
    userType: '',
    fullName: '',
    email: '',
    passcode: '',
    confirmPasscode: '',
  });

  // Ảnh đại diện được lưu tạm
  const avatarRef = useRef(null);
  const [avatarUri, setAvatarUri] = useState(null); // Chỉ dùng cho hiển thị

  const [loading, setLoading] = useState(false);

  const { userType, fullName, email, passcode, confirmPasscode } = form;

  // Xin quyền truy cập ảnh
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          ]);
          if (
            granted['android.permission.READ_EXTERNAL_STORAGE'] !== PermissionsAndroid.RESULTS.GRANTED ||
            granted['android.permission.READ_MEDIA_IMAGES'] !== PermissionsAndroid.RESULTS.GRANTED
          ) {
            Alert.alert('Permission required', 'We need permission to access your media library.');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    })();
  }, []);

  // Hàm thay đổi input
  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Chọn ảnh đại diện
  const pickImage = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.5,
        allowsEditing: true,
        aspect: [1, 1],
      };

      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.error('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Error', `Failed to pick image: ${response.errorMessage}`);
        } else if (response.assets && response.assets.length > 0) {
          const file = response.assets[0];
          const uri = Platform.OS === 'android' ? file.uri : file.uri.replace('file://', '');
          const name = file.fileName || uri.split('/').pop();
          const type = file.type || `image/${uri.split('.').pop()?.toLowerCase() || 'jpeg'}`;

          avatarRef.current = {
            uri,
            name,
            type,
          };

          setAvatarUri(uri); // Để hiển thị UI
        }
      });
    } catch (error) {
      console.error('ImagePicker error:', error);
      Alert.alert('Error', `Failed to pick image: ${error.message}`);
    }
  };

  // Gửi đăng ký
  const handleSubmit = async () => {
    if (!fullName || !email || !passcode || !confirmPasscode || !userType) {
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }

    if (passcode !== confirmPasscode) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('password', passcode);
      let backendRole = userType === 'Người thuê' ? 'RENTER' : 'LESSOR';
      formData.append('role', backendRole);

      if (avatarRef.current) {
        formData.append('avatarUrl', {
          uri: avatarRef.current.uri,
          name: avatarRef.current.name,
          type: avatarRef.current.type,
        });
      }

      await APIs.post(endpoints['register'], formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Registration successful');

      // Chuyển sang màn hình xác minh
      navigation.navigate('EmailVerification', {
        email,
        fullName,
        passcode,
        avatar: avatarUri,
        userType,
      });
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.signUp}>Đăng ký</Text>
      <Text style={styles.needMore}>Khám phá nhiều hơn</Text>

      <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarPlaceholder}>Chọn Ảnh</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Tên tài khoản"
        value={fullName}
        onChangeText={(text) => handleInputChange('fullName', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Email đăng nhập"
        keyboardType="email-address"
        value={email}
        onChangeText={(text) => handleInputChange('email', text)}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        textContentType="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        secureTextEntry
        value={passcode}
        onChangeText={(text) => handleInputChange('passcode', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Xác nhận mật khẩu"
        secureTextEntry
        value={confirmPasscode}
        onChangeText={(text) => handleInputChange('confirmPasscode', text)}
      />

      <Text style={styles.userTypeLabel}>Loại người sử dụng</Text>
      <View style={styles.radioContainer}>
        {['Người thuê', 'Người cho thuê'].map((type) => (
          <TouchableOpacity
            key={type}
            style={styles.radioItem}
            onPress={() => handleInputChange('userType', type)}
          >
            <View style={styles.radioCircle}>
              {userType === type && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioText}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Đang xử lý...' : 'Đăng ký'}</Text>
      </TouchableOpacity>

      <Text style={styles.backToLogin}>Trở về đăng nhập</Text>
    </View>
  );
}