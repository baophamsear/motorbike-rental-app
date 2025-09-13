import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UserProfile from "../screens/UserProfile";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';

import AddButton from '../screens/shared/AddButton';
import MotorRentBoardScreen from "../screens/renter/MotorRentBoardScreen";
import MotorbikeDetailScreen from "../screens/renter/MotorbikeDetailScreen";
import SettingLocationScreen from "../screens/renter/PaymentBookingScreen";
import VNPayWebScreen from "../screens/renter/VNPayWebScreen";
import MomoWebScreen from "../screens/renter/MomoWebScreen";
import MomoPaymentScreen from "../screens/renter/MomoPaymentScreen";
import MyBookingsScreen from "../screens/renter/MyBookingsScreen";
import MessageScreen from "../screens/renter/MessageScreen";
import BookingDetailScreen from "../screens/renter/BookingDetailScreen";
import PaymentBookingScreen from "../screens/renter/PaymentBookingScreen";
import SearchMotorScreen from "../screens/renter/SearchMotorScreen";
import NotificationsScreen from "../screens/renter/NotificationsScreen";



const DashboardStack = createNativeStackNavigator();
const BookingStack = createNativeStackNavigator();

function DashboardStackNavigator() {
    return (
        <DashboardStack.Navigator screenOptions={{ headerShown: false }}>

            <DashboardStack.Screen name="MotorRentBoard" component={MotorRentBoardScreen} />
            <DashboardStack.Screen name="UserProfile" component={UserProfile} />
            <DashboardStack.Screen name="MotorbikeDetail" component={MotorbikeDetailScreen} />
            <DashboardStack.Screen name="SearchMotor" component={SearchMotorScreen} />
            <DashboardStack.Screen name="VNPayWeb" component={VNPayWebScreen} />
            <DashboardStack.Screen name="MomoWeb" component={MomoWebScreen} />

        </DashboardStack.Navigator>
    );
}

function BookingStackNavigator() {
    return (
        <BookingStack.Navigator screenOptions={{ headerShown: false }}>
            <BookingStack.Screen name="MyBookings" component={MyBookingsScreen} />
            <BookingStack.Screen name="BookingDetail" component={BookingDetailScreen} />
            <BookingStack.Screen name="PaymentBooking" component={PaymentBookingScreen} />
            <BookingStack.Screen name="MomoPayment" component={MomoPaymentScreen} />
        </BookingStack.Navigator>
    );
}

const Tab = createBottomTabNavigator();

export default function RenterTabNavigator() {

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
                name="MyBookings"
                component={BookingStackNavigator}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book" size={size} color={color} />
                    ),
                    tabBarLabel: 'Đã đặt',
                }}
            />




            <Tab.Screen
                name="Notification"
                component={NotificationsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubbles" size={size} color={color} />
                    ),
                    tabBarLabel: 'Thông báo',
                }}
            />


            <Tab.Screen name="Profile" component={UserProfile} />
        </Tab.Navigator>
    );
}
