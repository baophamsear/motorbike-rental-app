import UserProfile from "../screens/UserProfile";

const LessorTabNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="UserProfile" component={UserProfile} />
        
        </Stack.Navigator>
    );
}
export default LessorTabNavigator;