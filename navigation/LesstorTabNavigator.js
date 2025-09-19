import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';

import MyMotorBoard from "../screens/lessor/MyMotorBoardScreen";
import UserProfile from "../screens/UserProfile";
import MotorManagement from '../screens/lessor/MotorManagementScreen';

import AddButton from '../screens/shared/AddButton'; // custom button giữa
import AddMotorbike from '../screens/lessor/AddMotorbikeScreen';
import ContractManagement from '../screens/lessor/ContractManagementScreen';
import ContractEditScreen from '../screens/lessor/ContractEditScreen';
import RentalDetailScreen from '../screens/lessor/RentalDetailScreen';
import MessageScreen from "../screens/lessor/NotificationsScreen";
import MotorDetailScreen from '../screens/lessor/MotorDetailScreen';
import ContractDetailScreen from '../screens/lessor/ContractDetailScreen';
import UserProfileScreen from '../screens/lessor/UserProfileScreen';

// // Stack cho Profile
// const ProfileStack = createNativeStackNavigator();

// function ProfileStackNavigator() {
//   return (
//     <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
//       <ProfileStack.Screen name="UserProfile" component={UserProfileScreen} />
//     </ProfileStack.Navigator>
//   );
// }

// Stack cho Dashboard
const DashboardStack = createNativeStackNavigator();

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="MyMotorBoard" component={MyMotorBoard} />
      <DashboardStack.Screen name="MotorManagement" component={MotorManagement} />
      <DashboardStack.Screen name="AddMotorbike" component={AddMotorbike} />
      <DashboardStack.Screen name="ContractManagement" component={ContractManagement} />
      <DashboardStack.Screen name="ContractEdit" component={ContractEditScreen} />
      <DashboardStack.Screen name="RentalDetail" component={RentalDetailScreen} />
      <DashboardStack.Screen name="MotorDetail" component={MotorDetailScreen} />
      <DashboardStack.Screen name="ContractDetail" component={ContractDetailScreen} />

    </DashboardStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function LessorTabNavigator() {

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') {
            return <Ionicons name="home" size={size} color={color} />;
          } else if (route.name === 'Profile') {
            return <Ionicons name="person" size={size} color={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} />


      <Tab.Screen
        name="Messages"
        component={MessageScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
          tabBarLabel: 'Tin nhắn',
        }}
      />

      <Tab.Screen name="Profile" component={UserProfile} />
    </Tab.Navigator>
  );
}
