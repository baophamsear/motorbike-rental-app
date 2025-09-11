import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import APIs, { endpoints } from '../../configs/APIs';
import { getAuthApi } from '../../utils/useAuthApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddMotorbike() {
  const [agreed, setAgreed] = useState(false);
  const [brands, setBrands] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [modalBrandVisible, setModalBrandVisible] = useState(false);
  const [modalLocationVisible, setModalLocationVisible] = useState(false);
  const [bikeImages, setBikeImages] = useState([]);
  const [documentImages, setDocumentImages] = useState([]);
  const [motorName, setMotorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    // Yêu cầu quyền khi component mount
    (async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          ]);
          if (
            granted['android.permission.READ_EXTERNAL_STORAGE'] !== PermissionsAndroid.RESULTS.GRANTED ||
            granted['android.permission.READ_MEDIA_IMAGES'] !== PermissionsAndroid.RESULTS.GRANTED
          ) {
            Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh để chọn ảnh!');
          }
        } catch (err) {
          console.warn('Permission error:', err);
          Alert.alert('Lỗi', 'Không thể yêu cầu quyền truy cập thư viện ảnh.');
        }
      }
    })();
    fetchBrands();
    fetchLocations();
  }, [fetchBrands, fetchLocations]);

  const fetchBrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await APIs.get(endpoints['brands']);
      setBrands(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách hãng xe.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await APIs.get(endpoints['locations']);
      setLocations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách địa điểm.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickBikeImages = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.7,
        allowsMultipleSelection: true,
      };

      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.error('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Lỗi', `Không thể chọn ảnh: ${response.errorMessage}`);
        } else if (response.assets && response.assets.length > 0) {
          const selected = response.assets.map((asset) => {
            console.log('Asset:', asset);
            return {
              uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
              name: asset.fileName || asset.uri.split('/').pop(),
              type: asset.type || `image/${asset.uri.split('.').pop()?.toLowerCase() || 'jpeg'}`,
            };
          });
          setBikeImages((prev) => [...prev, ...selected]);
        }
      });
    } catch (error) {
      console.error('ImagePicker error:', error);
      Alert.alert('Lỗi', `Không thể mở thư viện ảnh: ${error.message}`);
    }
  };

  const pickDocumentImages = async () => {
    try {
      const options = {
        mediaType: 'photo',
        quality: 0.7,
        allowsMultipleSelection: true,
      };

      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled document picker');
        } else if (response.errorCode) {
          console.error('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Lỗi', `Không thể chọn ảnh: ${response.errorMessage}`);
        } else if (response.assets && response.assets.length > 0) {
          const selected = response.assets.map((asset) => {
            console.log('Asset:', asset);
            return {
              uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
              name: asset.fileName || asset.uri.split('/').pop(),
              type: asset.type || `image/${asset.uri.split('.').pop()?.toLowerCase() || 'jpeg'}`,
            };
          });
          setDocumentImages((prev) => [...prev, ...selected]);
        }
      });
    } catch (error) {
      console.error('ImagePicker error:', error);
      Alert.alert('Lỗi', `Không thể mở thư viện ảnh: ${error.message}`);
    }
  };

  const submitButton = async () => {
    if (!motorName || !selectedBrand || !selectedLocation || bikeImages.length === 0 || documentImages.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin và tải lên ít nhất một ảnh xe và giấy tờ.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    const motorbike = {
      name: motorName,
      brand: { brandId: selectedBrand?.brandId },
      location: { locationId: selectedLocation?.locationId },
    };

    formData.append('motorbike', JSON.stringify(motorbike));
    bikeImages.forEach((image, index) => {
      formData.append('motorImages', {
        uri: image.uri,
        name: `bike_image_${index}.jpg`,
        type: 'image/jpeg',
      });
    });
    documentImages.forEach((image, index) => {
      formData.append('licenseImages', {
        uri: image.uri,
        name: `license_image_${index}.jpg`,
        type: 'image/jpeg',
      });
    });

    try {
      const api = await getAuthApi();
      console.log('Sending FormData:', formData);
      const response = await api.post(endpoints['motorbikes'], formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      console.log('Form submission response:', response.data);
      Alert.alert('Thành công', 'Đăng ký xe thành công!');
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting form:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderModalItem = ({ item, type }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        if (type === 'brand') {
          setSelectedBrand(item);
          setModalBrandVisible(false);
        } else {
          setSelectedLocation(item);
          setModalLocationVisible(false);
        }
      }}
    >
      <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" style={styles.modalIcon} />
      <Text style={styles.modalItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={28} color="#1F2A44" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm xe mới</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Đăng ký thông tin xe của bạn</Text>

        {/* Tên xe */}
        <Text style={styles.label}>Tên xe</Text>
        <TextInput
          placeholder="Ví dụ: Honda Wave 2020..."
          style={styles.input}
          value={motorName}
          onChangeText={setMotorName}
          placeholderTextColor="#6B7280"
        />

        {/* Hãng xe và địa điểm */}
        <View style={styles.row}>
          <View style={styles.inputHalf}>
            <Text style={styles.label}>Hãng xe</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setModalBrandVisible(true)}>
              <Text style={[styles.dropdownText, selectedBrand ? styles.dropdownTextSelected : null]}>
                {selectedBrand?.name || 'Chọn hãng xe'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputHalf}>
            <Text style={styles.label}>Địa điểm</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setModalLocationVisible(true)}>
              <Text style={[styles.dropdownText, selectedLocation ? styles.dropdownTextSelected : null]}>
                {selectedLocation?.name || 'Chọn địa điểm'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal chọn hãng xe */}
        <Modal visible={modalBrandVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn hãng xe</Text>
              <FlatList
                data={brands}
                keyExtractor={(item) => item.brandId.toString()}
                renderItem={({ item }) => renderModalItem({ item, type: 'brand' })}
                contentContainerStyle={styles.modalList}
              />
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalBrandVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal chọn địa điểm */}
        <Modal visible={modalLocationVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn địa điểm</Text>
              <FlatList
                data={locations}
                keyExtractor={(item) => item.locationId.toString()}
                renderItem={({ item }) => renderModalItem({ item, type: 'location' })}
                contentContainerStyle={styles.modalList}
              />
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalLocationVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Hình ảnh xe */}
        <Text style={styles.label}>Hình ảnh xe</Text>
        <View style={styles.imageGrid}>
          {bikeImages.length > 0 ? (
            bikeImages.map((item, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: item.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.deleteIcon}
                  onPress={() => setBikeImages(bikeImages.filter((_, i) => i !== index))}
                >
                  <Ionicons name="close-circle" size={24} color="#FF5722" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={40} color="#6B7280" />
              <Text style={styles.placeholderText}>Chưa có ảnh xe</Text>
            </View>
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={pickBikeImages} activeOpacity={0.7}>
            <Ionicons name="cloud-upload-outline" size={24} color="#4CAF50" />
            <Text style={styles.uploadButtonText}>Tải lên ảnh xe</Text>
          </TouchableOpacity>
        </View>

        {/* Hình ảnh giấy tờ */}
        <Text style={styles.label}>Hình ảnh giấy tờ xe</Text>
        <View style={styles.imageGrid}>
          {documentImages.length > 0 ? (
            documentImages.map((item, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: item.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.deleteIcon}
                  onPress={() => setDocumentImages(documentImages.filter((_, i) => i !== index))}
                >
                  <Ionicons name="close-circle" size={24} color="#FF5722" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="document-outline" size={40} color="#6B7280" />
              <Text style={styles.placeholderText}>Chưa có giấy tờ</Text>
            </View>
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocumentImages} activeOpacity={0.7}>
            <Ionicons name="cloud-upload-outline" size={24} color="#4CAF50" />
            <Text style={styles.uploadButtonText}>Tải lên giấy tờ</Text>
          </TouchableOpacity>
        </View>

        {/* Nút submit */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={submitButton}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Đăng ký xe</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2A44',
  },
  headerSpacer: {
    width: 28,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1F2A44',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  inputHalf: {
    flex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#6B7280',
  },
  dropdownTextSelected: {
    color: '#1F2A44',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalList: {
    paddingBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1F2A44',
  },
  modalIcon: {
    marginRight: 8,
  },
  modalCancel: {
    backgroundColor: '#FF5722',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeholderImage: {
    width: 100,
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  deleteIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  uploadButton: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2A44',
    marginTop: 12,
  },
});