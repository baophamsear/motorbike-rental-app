import React, {useContext, useState} from "react";
import {View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet} from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import loginStyles from "../../styles/LoginStyles";
import { useNavigation } from "@react-navigation/native";
import { MyDispatchContext } from "../../contexts/MyUserContext";
import APIs, { endpoints } from "../../configs/APIs";
import jwt_decode from "jwt-decode";



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

  const login = async () => {
    try {
      setLoading(true);

      const res = await APIs.post(endpoints['login'], {
        ...user
      });
      // console.info("Login response:", res.data);

      const token = res.data.token;

      console.info("Token received:", token);

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
          <Text style={loginStyles.title}>Rentaxo</Text>
          <Text style={loginStyles.subtitle}>Sign in</Text>
        </View>

        <Text style={loginStyles.label}>YOUR EMAIL</Text>
        <TextInput
          style={loginStyles.input}
          placeholder="yourmail@shrestha.com"
          placeholderTextColor="#999"
          value={user.email}
          onChangeText={(text) => updateUser(text, 'email')}
        />

        <Text style={loginStyles.label}>PASSWORD</Text>
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
          <Text style={loginStyles.loginText}>Login</Text>
        </TouchableOpacity>

        <View style={loginStyles.registerContainer}>
          <Text style={loginStyles.registerText}>Don’t have an account?</Text>
        </View>

        <TouchableOpacity style={loginStyles.createButton}>
          <Text style={loginStyles.createText}>Create an Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

