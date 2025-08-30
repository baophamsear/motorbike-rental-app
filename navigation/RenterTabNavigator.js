import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UserProfile from "../screens/UserProfile";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';

import AddButton from '../screens/shared/AddButton';
import MotorRentBoardScreen from "../screens/renter/MotorRentBoardScreen";
import MotorbikeDetailScreen from "../screens/renter/MotorbikeDetailScreen";


const DashboardStack = createNativeStackNavigator();

function DashboardStackNavigator() {
    return (
        <DashboardStack.Navigator screenOptions={{ headerShown: false }}>

            <DashboardStack.Screen name="MotorRentBoard" component={MotorRentBoardScreen} />
            <DashboardStack.Screen name="UserProfile" component={UserProfile} />
            <DashboardStack.Screen name="MotorbikeDetail
            " component={MotorbikeDetailScreen} />
        </DashboardStack.Navigator>
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
                name="Add"
                component={() => null}
                options={{
                    tabBarButton: () => <AddButton />,
                }}
                listeners={{
                    tabPress: e => e.preventDefault(),
                }}
            />


            <Tab.Screen name="Profile" component={UserProfile} />
        </Tab.Navigator>
    );
}
