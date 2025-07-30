import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from './screens/auth/Login';
import { useReducer } from 'react';
import MyUseReducer from './contexts/reducers/MyUseReducer';
import AuthNavigator from './navigation/AuthNavigator';
import RenterTabNavigator from './navigation/RenterTabNavigator';
import LessorTabNavigator from './navigation/LesstorTabNavigator';
import { MyUserContext, MyDispatchContext } from './contexts/MyUserContext'; // Đảm bảo đúng đường dẫn


const Stack = createNativeStackNavigator();

export default function App() {
  const [user, dispatch] = useReducer(MyUseReducer, null);
  const userRole = user ? user.user?.role : null;

  return (
    <MyDispatchContext.Provider value={dispatch}>
      <MyUserContext.Provider value={state}>
        <NavigationContainer key={user ? user?.user?.role : Math.random()}>
          {user?.user === null ? (
              <AuthNavigator />
            ) : userRole === "renter" ? (
              <RenterTabNavigator/>
            ) : userRole === "lessor" (
              <LessorTabNavigator/>
            )}
        </NavigationContainer>
      </MyUserContext.Provider>
    </MyDispatchContext.Provider>
  );
}


