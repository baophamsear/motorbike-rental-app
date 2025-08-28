import { authApis } from '../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAuthApi = async () => {
    console.log("hello");
  const token = await AsyncStorage.getItem("access-token");
  console.log("Auth token:", token);
  return authApis(token);
};
