import React, { useEffect, useState } from 'react';
import styles from '../../assets/styles/addMotorbikeStyles';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import APIs, { authApis, endpoints } from '../../configs/APIs';
import { getAuthApi, useAuthApi } from '../../utils/useAuthApi';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import { useNavigation } from '@react-navigation/native';
// import CheckBox from '@react-native-community/checkbox'; // nếu bạn dùng thư viện này

export default function AddMotorbike() {
  const [agreed, setAgreed] = useState(false);
  const [brands, setBrands] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [modalBrandVisible, setModalBrandVisible] = useState(false);
  const [modalLocationVisible, setModalLocationVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  const [images, setImages] = useState([]);
  const [bikeImages, setBikeImages] = useState([]);
  const [documentImages, setDocumentImages] = useState([]);
  const [motorName, setMotorName] = useState('');
  const nav = useNavigation();
  

  

  const fetchBrands = async () => {
    try {
      const response = await APIs.get(endpoints['brands']);
      setBrands(response.data);

    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await APIs.get(endpoints['locations']);
      setLocations(response.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const pickBikeImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const selected = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.uri.split('/').pop(),
        type: 'image/' + asset.uri.split('.').pop(),
      }));
      setBikeImages([...bikeImages, ...selected]);
    }
  };

  const pickDocumentImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const selected = result.assets.map(asset => ({
        uri: asset.uri,
        name: asset.uri.split('/').pop(),
        type: 'image/' + asset.uri.split('.').pop(),
      }));
      setDocumentImages([...documentImages, ...selected]);
    }
  };

  const submitButton = async () => {
    console.log("Submitting motorbike with data:");
    
    const formData = new FormData();

    const api = await getAuthApi();
    console.log("Auth APIs:", api);
    console.log("Selected Brand:", api);

    // motorbike object
    const motorbike = {
      name: motorName,
      brand: { brandId: selectedBrand?.brandId },
      location: { locationId: selectedLocation?.locationId },
      // pricePerDay: Number(pricePerDay), // thêm nếu có
      // licensePlate: licensePlateText,   // thêm nếu có
      // ... các trường khác
    };

    formData.append("motorbike", JSON.stringify(motorbike)); // 👈 đúng với Postman

    // Ảnh xe
    bikeImages.forEach((image, index) => {
      formData.append("motorImages", {
        uri: image.uri,
        name: `bike_image_${index}.jpg`,
        type: "image/jpeg",
      });
    });

    // Ảnh giấy tờ
    documentImages.forEach((image, index) => {
      formData.append("licenseImages", {
        uri: image.uri,
        name: `license_image_${index}.jpg`,
        type: "image/jpeg",
      });
    });

    console.log("Submitting form data:", formData);

    try {
      const response = await api.post(endpoints['motorbikes'], formData);
      console.log("Form submission response:", response);

      nav.goBack();
      alert("Đăng ký xe thành công!");
      nav.goBack();
    } catch (error) {
      console.error("Error submitting form:", error.response?.data || error);
      alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  };


  useEffect(() => {
    fetchBrands();
    fetchLocations();
    console.log('Fetched brands:', brands);
    console.log('Fetched locations:', locations);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={styles.subtitle}>Đăng kí thông tin xe của bạn</Text>


        <Text style={{ fontSize: 17, fontWeight: '500', marginVertical: 10, marginLeft: 5}}>Tên xe</Text>
        <TextInput placeholder="Ví dụ: Honda wave 2020..." style={styles.input} value={motorName} onChangeText={setMotorName} />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={{ fontSize: 17, fontWeight: '500', marginVertical: 10, marginLeft: 5 }}>Hãng xe</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setModalBrandVisible(true)}
            >
              <Text style={{ color: selectedBrand ? '#000' : '#999', fontSize: 17 }}>
                {selectedBrand?.name || 'Chọn Hãng'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.half}>
            <Text style={{ fontSize: 17, fontWeight: '500', marginVertical: 10, marginLeft: 5 }}>Địa điểm</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setModalLocationVisible(true)}
            >
              <Text style={{ color: selectedLocation ? '#000' : '#999', fontSize: 17 }}>
                {selectedLocation?.name || 'Chọn Địa điểm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        <Modal
          visible={modalBrandVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Brand</Text>

              <ScrollView>
                {brands.map((brand) => (
                  <TouchableOpacity
                    key={brand.brandId}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedBrand(brand);
                      setModalBrandVisible(false);
                    }}
                  >
                    <Ionicons name="folder-outline" size={20} color="#555" style={{ marginRight: 8 }} />
                    <Text style={styles.modalItemText}>{brand.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalBrandVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={modalLocationVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Location</Text>

              <ScrollView>
                {locations.map((location) => (
                  <TouchableOpacity
                    key={location.locationId}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedLocation(location);
                      setModalLocationVisible(false);
                    }}
                  >
                    <Ionicons name="folder-outline" size={20} color="#555" style={{ marginRight: 8 }} />
                    <Text style={styles.modalItemText}>{location.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalLocationVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={{ marginBottom: 10, fontWeight: '600', fontSize: 16 }}>Hình ảnh xe</Text>
        <View style={styles.flatlistWrapper}>
          <FlatList
            data={bikeImages}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            style={{ maxHeight: 130 }}
            contentContainerStyle={styles.imagePreviewContainer}
            renderItem={({ item, index }) => (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: item.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.deleteIcon}
                  onPress={() => {
                    const updated = bikeImages.filter((_, i) => i !== index);
                    setBikeImages(updated);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity onPress={pickBikeImages} style={styles.uploadBox}>
            <Ionicons name="cloud-upload-outline" size={24} style={{ marginTop: 8 }} color="#888" />
            <Text style={styles.uploadText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {/* <TouchableOpacity onPress={pickBikeImages} style={styles.uploadBox}>
          <Ionicons name="cloud-upload-outline" size={24} color="#888" />
          <Text style={styles.uploadText}>Chọn ảnh xe</Text>
        </TouchableOpacity> */}


        <Text style={{ marginBottom: 10, fontWeight: '600', fontSize: 16 }}>Hình ảnh giấy tờ xe</Text>
        <View style={styles.flatlistWrapper}>
          <FlatList
            data={documentImages}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            style={{ maxHeight: 130}}
            contentContainerStyle={styles.imagePreviewContainer}
            renderItem={({ item, index }) => (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: item.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.deleteIcon}
                  onPress={() => {
                    const updated = documentImages.filter((_, i) => i !== index);
                    setDocumentImages(updated);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity onPress={pickDocumentImages} style={styles.uploadBox}>
            <Ionicons name="cloud-upload-outline" size={24} color="#888" />
            <Text style={styles.uploadText}>Upload</Text>
          </TouchableOpacity>
        </View>

        


        


        

        

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={submitButton}
        >
          <Text style={styles.submitText}>SUBMIT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
