import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from './screens/auth/Login';
import { useEffect, useReducer } from 'react';
import MyUseReducer from './contexts/reducers/MyUseReducer';
import AuthNavigator from './navigation/AuthNavigator';
import RenterTabNavigator from './navigation/RenterTabNavigator';
import LessorTabNavigator from './navigation/LesstorTabNavigator';
import { MyUserContext, MyDispatchContext } from './contexts/MyUserContext'; // Đảm bảo đúng đường dẫn
import MapboxGL from '@rnmapbox/maps';


MapboxGL.setAccessToken('pk.eyJ1IjoiYmFvcGhhbTAxMTAiLCJhIjoiY21leTc3dmdvMWVoNTJrcHlvY29xODZkYSJ9.vnT3usPvz6o6c-7X10sSmw');


const Stack = createNativeStackNavigator();

export default function App() {
  const [user, dispatch] = useReducer(MyUseReducer, null);
  const userRole = user?.user?.role; 
  console.info("User role in App:", userRole);
  console.log("User from context:", user);

  

  return (
    <MyDispatchContext.Provider value={dispatch}>
      <MyUserContext.Provider value={user}>
        <NavigationContainer key={userRole ?? 'auth'}>
          {!user?.isLoggedIn ? (
              <AuthNavigator />
            ) : userRole === 'renter' ? (
              <RenterTabNavigator/>
            ) : userRole === 'lessor' ?(
              <LessorTabNavigator/>
            ) : null}
        </NavigationContainer>
      </MyUserContext.Provider>
    </MyDispatchContext.Provider>
  );
}


