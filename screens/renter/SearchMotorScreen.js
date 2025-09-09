import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuthApi } from '../../utils/useAuthApi';
import { endpoints } from '../../configs/APIs';
import * as Location from 'expo-location';

MapboxGL.setAccessToken('pk.eyJ1IjoiYmFvcGhhbTAxMTAiLCJhIjoiY21leTc3dmdvMWVoNTJrcHlvY29xODZkYSJ9.vnT3usPvz6o6c-7X10sSmw');

const MAP_STYLE = 'mapbox://styles/mapbox/streets-v11';
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function MapScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([106.6297, 10.8231]); // Default: TP.HCM
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const navigation = useNavigation();
  const cameraRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập bị từ chối', 'Cần quyền truy cập vị trí để tìm xe gần bạn', [
          { text: 'OK', onPress: () => fetchNearbyContracts(10.8231, 106.6297) },
        ]);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation([longitude, latitude]);
      setSelectedLocation([longitude, latitude]);
      fetchNearbyContracts(latitude, longitude);
    } catch (error) {
      console.error('Lỗi lấy vị trí:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại', [
        { text: 'OK', onPress: () => fetchNearbyContracts(10.8231, 106.6297) },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchNearbyContracts = useCallback(async (latitude, longitude) => {
    setIsLoading(true);
    try {
      const api = await getAuthApi();
      const res = await api.get(endpoints['getNearbyBikes'], {
        params: { lat: latitude, lng: longitude, radiusKm: 5 },
      });
      const mapped = res.data.map((contract) => ({
        id: contract.contractId,
        bike: contract.bike,
        location: contract.location,
        pricePerDay: contract.bike.pricePerDay,
        image: contract.bike.imageUrl?.[0] || 'https://via.placeholder.com/150',
        rating: contract.bike.rating || 4.5,
        reviews: contract.bike.reviews || 30,
      }));
      setProperties(mapped);
    } catch (err) {
      console.error('Lỗi lấy danh sách xe:', err);
      Alert.alert('Lỗi', 'Không thể tải danh sách xe gần đây');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query) {
      setSuggestions([]);
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
      setSuggestions(data.features);
    } catch (err) {
      console.error('Lỗi khi tìm gợi ý:', err);
    }
  }, []);

  const handleSelectSuggestion = useCallback((item) => {
    const [lng, lat] = item.center;
    setSelectedLocation([lng, lat]);
    setSearchQuery(item.place_name);
    setSuggestions([]);
    cameraRef.current?.setCamera({
      centerCoordinate: [lng, lat],
      zoomLevel: 13,
      animationDuration: 1000,
    });
    fetchNearbyContracts(lat, lng);
  }, [fetchNearbyContracts]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa điểm để tìm kiếm');
      return;
    }
    setIsSearching(true);
    try {
      const result = await Location.geocodeAsync(searchQuery);
      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        const coords = [longitude, latitude];
        setSelectedLocation(coords);
        cameraRef.current?.setCamera({
          centerCoordinate: coords,
          zoomLevel: 13,
          animationDuration: 1000,
        });
        fetchNearbyContracts(latitude, longitude);
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy địa chỉ');
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm địa chỉ:', err);
      Alert.alert('Lỗi', 'Không thể tìm kiếm địa chỉ');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, fetchNearbyContracts]);

  const handleCenterUserLocation = useCallback(() => {
    if (userLocation) {
      setSelectedLocation(userLocation);
      cameraRef.current?.setCamera({
        centerCoordinate: userLocation,
        zoomLevel: 13,
        animationDuration: 1000,
      });
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy vị trí của bạn');
    }
  }, [userLocation]);

  const formatCurrency = useCallback((val) => (val ? val.toLocaleString('vi-VN') : '0'), []);

  const renderMarker = useCallback(
    (item) => {
      const loc = item.location;
      if (!loc || !loc.longitude || !loc.latitude) return null;
      const coords = [loc.longitude, loc.latitude];
      return (
        <MapboxGL.PointAnnotation
          key={`point-${item.id}`}
          id={`point-${item.id}`}
          coordinate={coords}
          onSelected={() => setSelectedLocation(coords)}
        >
          <View style={styles.marker}>
            <Text style={styles.markerText}>{formatCurrency(item.pricePerDay)}</Text>
          </View>
        </MapboxGL.PointAnnotation>
      );
    },
    [formatCurrency]
  );

  const renderProperty = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('BookingDetail', {
            rental: { rentalId: item.id, rentalContract: { bike: item.bike } },
          })
        }
      >
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        <View style={styles.cardInfo}>
          <Text style={styles.title}>{item.bike.name || 'N/A'}</Text>
          <Text style={styles.city} numberOfLines={1} ellipsizeMode="tail">
            {item.location?.address || 'Không rõ vị trí'}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.info}>
              <Ionicons name="star" size={14} color="#FFCA28" /> {item.rating} ({item.reviews})
            </Text>
            <Text style={styles.info}>🚴 Xe máy</Text>
          </View>
          <Text style={styles.price}>
            {formatCurrency(item.pricePerDay)} <Text style={styles.perDay}>/ ngày</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() =>
            navigation.navigate('BookingDetail', {
              rental: { rentalId: item.id, rentalContract: { bike: item.bike } },
            })
          }
        >
          <Text style={styles.bookButtonText}>Đặt ngay</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [formatCurrency, navigation]
  );

  const renderSuggestion = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSelectSuggestion(item)}
      >
        <Ionicons name="location-outline" size={20} color="#4CAF50" style={styles.suggestionIcon} />
        <Text style={styles.suggestionText} numberOfLines={1} ellipsizeMode="tail">
          {item.place_name}
        </Text>
      </TouchableOpacity>
    ),
    [handleSelectSuggestion]
  );

  const getItemLayout = useCallback(
    (data, index) => ({
      length: 130,
      offset: 130 * index,
      index,
    }),
    []
  );

  const getSuggestionLayout = useCallback(
    (data, index) => ({
      length: 48,
      offset: 48 * index,
      index,
    }),
    []
  );

  const memoizedProperties = useMemo(() => properties, [properties]);
  const memoizedSuggestions = useMemo(() => suggestions, [suggestions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={[styles.searchBar, isInputFocused && styles.searchBarFocused]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2A44" />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, isInputFocused && styles.inputFocused]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm kiếm địa điểm (VD: TP.HCM)"
            placeholderTextColor="#6B7280"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <Ionicons name="search" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        </View>
        {memoizedSuggestions.length > 0 && (
          <FlatList
            style={styles.suggestionContainer}
            data={memoizedSuggestions}
            keyExtractor={(item) => item.id}
            renderItem={renderSuggestion}
            getItemLayout={getSuggestionLayout}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Map */}
        <View style={[styles.mapContainer, isMapFullScreen && styles.mapFullScreen]}>
          <MapboxGL.MapView style={styles.map} styleURL={MAP_STYLE}>
            <MapboxGL.UserLocation visible={true} renderMode="custom" androidRenderMode="normal">
              <View style={styles.userMarker}>
                <View style={styles.userMarkerPulse} />
                <Ionicons name="person-circle" size={36} color="#4CAF50" />
              </View>
            </MapboxGL.UserLocation>
            <MapboxGL.Camera
              ref={cameraRef}
              zoomLevel={13}
              centerCoordinate={selectedLocation}
              animationDuration={500}
            />
            {selectedLocation && (
              <MapboxGL.PointAnnotation id="searched-location" coordinate={selectedLocation}>
                <View style={styles.selectedMarker}>
                  <View style={styles.selectedMarkerPulse} />
                  <Ionicons name="location-sharp" size={32} color="#FF5722" />
                </View>
              </MapboxGL.PointAnnotation>
            )}
            {memoizedProperties.map(renderMarker)}
          </MapboxGL.MapView>
          <TouchableOpacity
            style={styles.toggleMapButton}
            onPress={() => setIsMapFullScreen(!isMapFullScreen)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isMapFullScreen ? 'contract-outline' : 'expand-outline'}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.centerUserButton}
            onPress={handleCenterUserLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="locate-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* List */}
        {!isMapFullScreen && (
          <View style={styles.listContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size={48} color="#4CAF50" />
                <Text style={styles.loadingText}>Đang tải danh sách xe...</Text>
              </View>
            ) : memoizedProperties.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="bicycle-outline" size={48} color="#6B7280" />
                <Text style={styles.emptyText}>Không tìm thấy xe nào gần đây</Text>
              </View>
            ) : (
              <>
                <Text style={styles.resultText}>Tìm thấy {memoizedProperties.length} xe</Text>
                <FlatList
                  data={memoizedProperties}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderProperty}
                  contentContainerStyle={styles.listContent}
                  initialNumToRender={5}
                  getItemLayout={getItemLayout}
                />
              </>
            )}
          </View>
        )}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchBarFocused: {
    borderColor: '#4CAF50',
    shadowOpacity: 0.2,
  },
  input: {
    flex: 1,
    marginHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2A44',
  },
  inputFocused: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  searchButton: {
    padding: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
  },
  suggestionContainer: {
    maxHeight: 200,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
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
    height: screenHeight * 0.45,
    width: screenWidth - 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mapFullScreen: {
    height: screenHeight - 100,
  },
  map: {
    flex: 1,
  },
  toggleMapButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  centerUserButton: {
    position: 'absolute',
    bottom: 20,
    right: 76,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  userMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF5044',
    transform: [{ scale: 1 }],
  },
  marker: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderColor: '#fff',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  markerText: {
    fontWeight: '700',
    color: '#fff',
    fontSize: 14,
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
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 16,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  image: {
    width: 120,
    height: 100,
    borderRadius: 12,
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 6,
  },
  city: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: '#6B7280',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF5722',
  },
  perDay: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#1F2A44',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});