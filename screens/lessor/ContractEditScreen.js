import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapboxGL from '@rnmapbox/maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getAuthApi } from '../../utils/useAuthApi';
import { endpoints } from '../../configs/APIs';
import DatePicker from 'react-native-date-picker';

MapboxGL.setAccessToken('pk.eyJ1IjoiYmFvcGhhbTAxMTAiLCJhIjoiY21leTc3dmdvMWVoNTJrcHlvY29xODZkYSJ9.vnT3usPvz6o6c-7X10sSmw');

const MAP_STYLE = 'mapbox://styles/mapbox/streets-v11';
const DEFAULT_COORDINATES = [106.6297, 10.8231]; // Default: Ho Chi Minh City

export default function EditContractScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { contract } = route.params;
  const cameraRef = useRef(null);

  // Hàm kiểm tra số hợp lệ
  const isFiniteNumber = (value) => typeof value === 'number' && isFinite(value);

  // Validate initial coordinates
  const initialLocation = contract.bike?.location
    ? [
        isFiniteNumber(contract.bike.location.longitude) ? contract.bike.location.longitude : DEFAULT_COORDINATES[0],
        isFiniteNumber(contract.bike.location.latitude) ? contract.bike.location.latitude : DEFAULT_COORDINATES[1],
      ]
    : DEFAULT_COORDINATES;

  const [paymentCycle, setPaymentCycle] = useState(contract.paymentCycle || 'weekly');
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [startDate, setStartDate] = useState(contract.startDate ? new Date(contract.startDate) : null);
  const [endDate, setEndDate] = useState(contract.endDate ? new Date(contract.endDate) : null);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(contract.bike?.location?.name || '');
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Validate and update camera when selectedLocation changes
  useEffect(() => {
    if (isFiniteNumber(selectedLocation[0]) && isFiniteNumber(selectedLocation[1])) {
      cameraRef.current?.setCamera({
        centerCoordinate: selectedLocation,
        zoomLevel: 13,
        animationDuration: 500,
      });
    } else {
      console.warn('Invalid coordinates, reverting to default:', selectedLocation);
      setSelectedLocation(DEFAULT_COORDINATES);
    }
  }, [selectedLocation]);

  const formatDate = useCallback((date) => {
    if (!date) return 'Chọn ngày';
    const d = date instanceof Date ? date : new Date(date);
    return isNaN(d.getTime()) ? 'Chọn ngày' : d.toLocaleDateString('vi-VN');
  }, []);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query) {
      setSuggestions([]);
      setSearchError('');
      return;
    }
    try {
      const accessToken = 'pk.eyJ1IjoiYmFvcGhhbTAxMTAiLCJhIjoiY21leTc3dmdvMWVoNTJrcHlvY29xODZkYSJ9.vnT3usPvz6o6c-7X10sSmw';
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${accessToken}&autocomplete=true&language=vi`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
      setSearchError('');
    } catch (err) {
      console.error('Lỗi khi tìm gợi ý:', err);
      setSearchError('Không thể tải gợi ý địa điểm');
    }
  }, []);

  const handleSelectSuggestion = useCallback((item) => {
    const [lng, lat] = item.center;
    if (isFiniteNumber(lng) && isFiniteNumber(lat)) {
      setSelectedLocation([lng, lat]);
      setSearchQuery(item.place_name);
      setSuggestions([]);
      setSearchError('');
    } else {
      console.error('Invalid suggestion coordinates:', item.center);
      setSearchError('Địa điểm được chọn có tọa độ không hợp lệ');
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchError('Vui lòng nhập địa điểm để tìm kiếm');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=pk.eyJ1IjoiYmFvcGhhbTAxMTAiLCJhIjoiY21leTc3dmdvMWVoNTJrcHlvY29xODZkYSJ9.vnT3usPvz6o6c-7X10sSmw&language=vi`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        if (isFiniteNumber(lng) && isFiniteNumber(lat)) {
          setSelectedLocation([lng, lat]);
          setSearchQuery(data.features[0].place_name);
          setSearchError('');
        } else {
          throw new Error('Invalid coordinates from search');
        }
      } else {
        setSearchError('Không tìm thấy địa chỉ');
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm địa chỉ:', err);
      setSearchError('Không thể tìm kiếm địa chỉ');
    } finally {
      setIsSubmitting(false);
    }
  }, [searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setSearchError('');
    setSelectedLocation(DEFAULT_COORDINATES);
  };

  const handleMapPress = useCallback(async (event) => {
    const { geometry } = event;
    const [lng, lat] = geometry.coordinates;
    if (isFiniteNumber(lng) && isFiniteNumber(lat)) {
      setSelectedLocation([lng, lat]);
      setIsSubmitting(true);
      try {
        const accessToken = 'pk.eyJ1IjoiYmFvcGhhbTAxMTAiLCJhIjoiY21leTc3dmdvMWVoNTJrcHlvY29xODZkYSJ9.vnT3usPvz6o6c-7X10sSmw';
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&language=vi`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          setSearchQuery(data.features[0].place_name);
          setSearchError('');
        } else {
          setSearchQuery('Vị trí không xác định');
          setSearchError('Không tìm thấy địa chỉ cho vị trí này');
        }
      } catch (err) {
        console.error('Lỗi reverse geocoding:', err);
        setSearchError('Không thể lấy địa chỉ từ vị trí');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.error('Invalid map press coordinates:', geometry.coordinates);
      setSearchError('Tọa độ không hợp lệ');
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!startDate || !endDate || !paymentCycle || !selectedLocation || !searchQuery) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin, bao gồm vị trí.');
      return;
    }
    if (!isFiniteNumber(selectedLocation[0]) || !isFiniteNumber(selectedLocation[1])) {
      Alert.alert('Lỗi', 'Tọa độ không hợp lệ. Vui lòng chọn lại vị trí.');
      return;
    }

    setIsSubmitting(true);
    try {
      const api = await getAuthApi();
      const payload = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        paymentCycle,
        locationPoint: {
          latitude: selectedLocation[1],
          longitude: selectedLocation[0],
          address: searchQuery,
        },
      };

      await api.patch(endpoints.updateContract(contract.contractId), payload);
      Alert.alert('Thành công', 'Cập nhật hợp đồng thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('Lỗi cập nhật:', err);
      Alert.alert('Lỗi', 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }, [startDate, endDate, paymentCycle, selectedLocation, searchQuery, contract.contractId, navigation]);

  const getStatusStyle = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { backgroundColor: '#FFCA28', color: '#1F2A44' };
      case 'approved':
        return { backgroundColor: '#22C55E', color: '#fff' };
      case 'rejected':
        return { backgroundColor: '#FF5722', color: '#fff' };
      default:
        return { backgroundColor: '#6B7280', color: '#fff' };
    }
  }, []);

  const getStatusLabel = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Đang chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Bị từ chối';
      default:
        return 'Không rõ';
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={28} color="#1F2A44" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa hợp đồng</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Contract Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Ionicons name="contract-outline" size={24} color="#4CAF50" />
                <Text style={styles.contractId}>Mã hợp đồng: {contract.contractId}</Text>
              </View>
              <View style={[styles.statusBadge, getStatusStyle(contract.status)]}>
                <Text style={[styles.statusText, { color: getStatusStyle(contract.status).color }]}>
                  {getStatusLabel(contract.status)}
                </Text>
              </View>
            </View>
            <View style={styles.tagContainer}>
              <View style={[styles.tag, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.tagText}>{contract.bike?.brand?.name || 'Không rõ'}</Text>
              </View>
            </View>
            <Text style={styles.price}>
              Giá chiết khấu: <Text style={styles.priceBold}>{contract.serviceFee?.toLocaleString('vi-VN')} VND</Text>
            </Text>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>Chủ xe: {contract.bike?.owner?.fullName || 'Không rõ'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>
                {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>{contract.bike?.location?.name || 'Không rõ'}</Text>
            </View>
            {contract.status === 'pending' && (
              <View style={styles.noticeBox}>
                <Ionicons name="alert-circle-outline" size={20} color="#FFCA28" />
                <Text style={styles.noticeText}>
                  Cần cập nhật thông tin để bắt đầu hoạt động hợp đồng.
                </Text>
              </View>
            )}
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>

            {/* Payment Cycle */}
            <View style={styles.inputContainer}>
              <Text style={styles.formLabel}>Chu kỳ thanh toán</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCycleModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerButtonText}>
                  {paymentCycle === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Modal visible={showCycleModal} transparent animationType="fade">
              <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCycleModal(false)}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Chọn chu kỳ thanh toán</Text>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      setPaymentCycle('weekly');
                      setShowCycleModal(false);
                    }}
                  >
                    <Text style={styles.modalText}>Hàng tuần</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      setPaymentCycle('monthly');
                      setShowCycleModal(false);
                    }}
                  >
                    <Text style={styles.modalText}>Hàng tháng</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Date Inputs */}
            <View style={styles.dateRow}>
              <View style={[styles.inputContainer, styles.dateInput]}>
                <Text style={styles.formLabel}>Ngày bắt đầu</Text>
                <TouchableOpacity style={styles.input} onPress={() => setIsStartOpen(true)}>
                  <Text style={styles.inputText}>{formatDate(startDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputContainer, styles.dateInput]}>
                <Text style={styles.formLabel}>Ngày kết thúc</Text>
                <TouchableOpacity style={styles.input} onPress={() => setIsEndOpen(true)}>
                  <Text style={styles.inputText}>{formatDate(endDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.warningText}>⚠️ Ngày chỉ chọn được 1 lần, hãy chọn cẩn thận.</Text>

            <DatePicker
              modal
              mode="date"
              open={isStartOpen}
              date={startDate || new Date()}
              onConfirm={(date) => {
                setIsStartOpen(false);
                setStartDate(date);
              }}
              onCancel={() => setIsStartOpen(false)}
            />
            <DatePicker
              modal
              mode="date"
              open={isEndOpen}
              date={endDate || new Date()}
              onConfirm={(date) => {
                setIsEndOpen(false);
                setEndDate(date);
              }}
              onCancel={() => setIsEndOpen(false)}
            />

            {/* Search Bar */}
            <View style={styles.inputContainer}>
              <Text style={styles.formLabel}>Tìm kiếm địa điểm</Text>
              <View style={[styles.searchBar, isInputFocused && styles.searchBarFocused]}>
                <TextInput
                  style={[styles.input, styles.searchInput, isInputFocused && styles.inputFocused]}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    fetchSuggestions(text);
                  }}
                  placeholder="Nhập địa điểm (VD: TP.HCM)"
                  placeholderTextColor="#6B7280"
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#6B7280" />
                  ) : (
                    <Ionicons name="search" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              </View>
              {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
            </View>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <View style={styles.suggestionContainer}>
                <ScrollView style={styles.suggestionScroll}>
                  {suggestions.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(item)}
                    >
                      <Ionicons name="location-outline" size={20} color="#4CAF50" style={styles.suggestionIcon} />
                      <Text style={styles.suggestionText} numberOfLines={1} ellipsizeMode="tail">
                        {item.place_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Map */}
            <View style={styles.inputContainer}>
              <Text style={styles.formLabel}>Vị trí trên bản đồ</Text>
              <Text style={styles.mapInstruction}>Nhấn vào bản đồ để chọn vị trí</Text>
              <View style={styles.mapContainer}>
                <MapboxGL.MapView
                  style={styles.map}
                  styleURL={MAP_STYLE}
                  onPress={handleMapPress}
                >
                  <MapboxGL.Camera
                    ref={cameraRef}
                    zoomLevel={13}
                    centerCoordinate={selectedLocation}
                    animationDuration={500}
                  />
                  {isFiniteNumber(selectedLocation[0]) && isFiniteNumber(selectedLocation[1]) && (
                    <MapboxGL.PointAnnotation id="selected-location" coordinate={selectedLocation}>
                      <View style={styles.selectedMarker}>
                        <View style={styles.selectedMarkerPulse} />
                        <Ionicons name="location-sharp" size={32} color="#FF5722" />
                      </View>
                    </MapboxGL.PointAnnotation>
                  )}
                </MapboxGL.MapView>
              </View>
              {searchQuery && (
                <View style={styles.addressContainer}>
                  <Ionicons name="location-outline" size={20} color="#4CAF50" />
                  <Text style={styles.addressText}>{searchQuery}</Text>
                </View>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu hợp đồng</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  container: {
    flex: 1,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contractId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
    marginLeft: 8,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tagContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  price: {
    fontSize: 16,
    color: '#1F2A44',
    marginBottom: 12,
  },
  priceBold: {
    fontWeight: '700',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2A44',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerButtonText: {
    fontSize: 16,
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
    width: '80%',
    maxHeight: '40%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalText: {
    fontSize: 16,
    color: '#1F2A44',
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputText: {
    fontSize: 16,
    color: '#1F2A44',
    flex: 1,
  },
  warningText: {
    fontSize: 14,
    color: '#FF5722',
    marginTop: 8,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchBarFocused: {
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2A44',
    paddingVertical: 8,
  },
  inputFocused: {
    backgroundColor: '#fff',
  },
  clearButton: {
    padding: 8,
  },
  searchButton: {
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF5722',
    marginTop: 8,
  },
  suggestionContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  suggestionScroll: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2A44',
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  mapInstruction: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  selectedMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMarkerPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF572244',
    transform: [{ scale: 1 }],
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
}); 