import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UserProfile from "../screens/UserProfile";

const Stack = createNativeStackNavigator();

const LessorTabNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="UserProfile" component={UserProfile} />
        
        </Stack.Navigator>
    );
}
export default LessorTabNavigator;