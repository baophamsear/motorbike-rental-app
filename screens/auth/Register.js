import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  const [avatarUri, setAvatarUri] = useState(null); // chỉ dùng cho hiển thị

  const [loading, setLoading] = useState(false);

  const { userType, fullName, email, passcode, confirmPasscode } = form;

  // Xin quyền truy cập ảnh
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need permission to access your media library.');
      }
    })();
  }, []);

  // Hàm thay đổi input
  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Chọn ảnh đại diện
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      const uri = file.uri;
      const name = uri.split('/').pop();
      const ext = name.split('.').pop();
      const type = `image/${ext}`;

      avatarRef.current = {
        uri,
        name,
        type,
      };

      setAvatarUri(uri); // để hiển thị UI
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
      formData.append('role', userType);

      if (avatarRef.current) {
        formData.append('avatarUrl', avatarRef.current); // ✅ đúng tên param trong backend
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
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Congratulations</Text>
      <Text style={styles.subtitle}>on verifying the email belongs to you</Text>
      <Text style={styles.signUp}>Sign up</Text>
      <Text style={styles.needMore}>we need something more</Text>

      <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarPlaceholder}>Select Avatar</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={fullName}
        onChangeText={(text) => handleInputChange('fullName', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="yourmail@example.com"
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
        placeholder="Passcode"
        secureTextEntry
        value={passcode}
        onChangeText={(text) => handleInputChange('passcode', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm passcode"
        secureTextEntry
        value={confirmPasscode}
        onChangeText={(text) => handleInputChange('confirmPasscode', text)}
      />

      <Text style={styles.userTypeLabel}>TYPE OF USER</Text>
      <View style={styles.radioContainer}>
        {['renter', 'lessor'].map((type) => (
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
        <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Submit'}</Text>
      </TouchableOpacity>

      <Text style={styles.backToLogin}>back to login</Text>
    </View>
  );
}
