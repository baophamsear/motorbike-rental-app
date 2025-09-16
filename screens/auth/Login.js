import React, {useContext, useState} from "react";
import {View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet} from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import loginStyles from "../../styles/LoginStyles";
import { useNavigation } from "@react-navigation/native";
import { MyDispatchContext } from "../../contexts/MyUserContext";
import APIs, { endpoints } from "../../configs/APIs";
import jwt_decode from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";



export default function Login() {
  const [user, setUser] = useState({
    'email': '',
    'password': ''
  });

  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const dispatch = useContext(MyDispatchContext);
  const [hidePassword, setHidePassword] = useState(true);

  const updateUser = (value, field) => {
      setUser({...user, [field]: value});
  }

  const createAccount = () => {
    navigation.navigate('Register');
  }

  const login = async () => {
    try {
      setLoading(true);

      const res = await APIs.post(endpoints['login'], {
        ...user
      });
      // console.info("Login response:", res.data);

      const token = res.data.token;

      console.info("Token received:", token);

      await AsyncStorage.setItem("access-token", token);
      console.info("✅ Token đã được lưu vào AsyncStorage!");

      const decoded = jwt_decode(token);
      console.info("Decoded token:", decoded);

      const role = decoded.roles?.[0]?.authority?.replace('ROLE_', '').toLowerCase();
      const email = decoded.sub;

      console.info("User role:", role);
      console.info("User email:", email);

      dispatch({
        type: 'login',
        payload: {
          role,
          email
        }
      });

    } catch (error) { 
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={loginStyles.container}>
      <View style={{ paddingHorizontal: 30 }}>
        <View style={{ marginTop: 40 }}>
          <Text style={loginStyles.title}>MotorRental</Text>
          <Text style={loginStyles.subtitle}>ĐĂNG NHẬP</Text>
        </View>

        <Text style={loginStyles.label}>email của bạn</Text>
        <TextInput
          style={loginStyles.input}
          placeholder="yourmail@gmail.com"
          placeholderTextColor="#999"
          value={user.email}
          onChangeText={(text) => updateUser(text, 'email')}
        />

        <Text style={loginStyles.label}>mật khẩu</Text>
        <View style={loginStyles.passwordContainer}>
          <TextInput
            style={[loginStyles.input, { flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor="#999"
            secureTextEntry={hidePassword}
            value={user.password}
            onChangeText={(text) => updateUser(text, 'password')}
          />
          <TouchableOpacity onPress={() => setHidePassword(!hidePassword)}>
            <Icon
              name={hidePassword ? 'eye-off' : 'eye'}
              size={20}
              color="#555"
              style={{ marginRight: 10 }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={loginStyles.loginButton} onPress={login} disabled={loading || !user.email || !user.password}>
          <Text style={loginStyles.loginText}>Đăng nhập</Text>
        </TouchableOpacity>

        <View style={loginStyles.registerContainer}>
          <Text style={loginStyles.registerText}>Bạn chưa có tài khoản?</Text>
        </View>

        <TouchableOpacity style={loginStyles.createButton}>
          <Text style={loginStyles.createText} onPress={createAccount}>Tạo tài khoản</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

