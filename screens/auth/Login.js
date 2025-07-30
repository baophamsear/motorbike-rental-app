import React, {useState} from "react";
import {View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet} from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import loginStyles from "../../styles/LoginStyles";

export default function Login() {
    const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);

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
          value={email}
          onChangeText={setEmail}
        />

        <Text style={loginStyles.label}>PASSWORD</Text>
        <View style={loginStyles.passwordContainer}>
          <TextInput
            style={[loginStyles.input, { flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor="#999"
            secureTextEntry={hidePassword}
            value={password}
            onChangeText={setPassword}
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

        <TouchableOpacity style={loginStyles.loginButton}>
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

