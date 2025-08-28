import React from 'react';
import { TouchableOpacity, View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';

export default function AddButton() {
  const navigation = useNavigation();

  const currentRoute = useNavigationState((state) => {
    const tabRoute = state.routes[state.index];
    if (tabRoute.state && tabRoute.state.index !== undefined) {
      const stackRoute = tabRoute.state.routes[tabRoute.state.index];
      return stackRoute.name;
    }
    return tabRoute.name;
  });

  const handleAddAction = () => {
    if (currentRoute === 'MotorManagement') {
        navigation.navigate('Dashboard', {
          screen: 'AddMotorbike',
        });
    } else if (currentRoute === 'MyMotorBoard') {
      Alert.alert('Thêm mục mới từ MyMotorBoard');
    } else if (currentRoute === 'Profile') {
      Alert.alert('Thêm ảnh đại diện chẳng hạn');
    } else {
      Alert.alert('Không xác định ngữ cảnh hiện tại');
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleAddAction}>
      <View style={styles.button}>
        <Ionicons name="add" size={30} color="black" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});
