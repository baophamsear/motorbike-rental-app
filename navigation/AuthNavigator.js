import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import EmailVerification from '../screens/auth/EmailVerification';


const Stack = createNativeStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* <Stack.Screen name="Login" component={Login} /> */}
    <Stack.Screen name="Register" component={Register} />
    {/* <Stack.Screen name="EmailVerification" component={EmailVerification} /> */}
  </Stack.Navigator>
);

export default AuthNavigator;
