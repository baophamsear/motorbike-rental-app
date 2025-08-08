import React, { useState, useEffect } from 'react';
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
  const [form, setForm] = useState({
    userType: '',
    fullName: '',
    email: '',
    passcode: '',
    confirmPasscode: '',
    avatar: null,
  });
  const [loading, setLoading] = useState(false);

  const { userType, fullName, email, passcode, confirmPasscode, avatar } = form;

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need permission to access your media library.');
      }
    })();
  }, []);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    console.log(form);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.cancelled) {
      handleInputChange('avatar', result.assets[0].uri);
    }
  };

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
      console.log("attempting registration");
      const res = await APIs.post(endpoints['register'], form, {
        // headers: {
        //   'Content-Type': 'application/json',
        // },
      });

      // console.log(res.data);

      // Sau khi gửi mã xác thực thành công, chuyển sang màn xác minh
      navigation.navigate('VerifyEmailCode', {
        email,
        fullName,
        passcode,
        avatar,
        userType,
      });
    } catch (error) {
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
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
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
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        textContentType="none" 
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

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Submit'}</Text>
      </TouchableOpacity>

      <Text style={styles.backToLogin}>back to login</Text>
    </View>
  );
}
