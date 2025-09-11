import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getAuthApi } from "../../utils/useAuthApi";
import { endpoints } from "../../configs/APIs";

export default function MotorRentBoardScreen() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenting, setIsRenting] = useState(true); // Trạng thái toggle
  const navigation = useNavigation();

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const api = await getAuthApi();
      const response = await api.get(endpoints["activeContracts"]);
      console.log('API response:', JSON.stringify(response.data, null, 2)); // Debug: Log dữ liệu API
      // Lọc contracts chỉ lấy xe có trạng thái available
      const availableContracts = response.data.filter(
        (contract) => contract.bike?.status === 'available'
      );
      console.log('Filtered available contracts:', availableContracts); // Debug: Log contracts đã lọc
      setContracts(availableContracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Welcome Title */}
        <Text style={styles.welcomeTitle}>Chào mừng đến với Rentaxo</Text>

        {/* Location Selector */}
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => navigation.navigate("Map")}
        >
          <Ionicons name="location-sharp" size={20} color="#4CAF50" />
          <Text style={styles.locationText}>Tp. Hồ Chí Minh</Text>
          <Ionicons name="chevron-down" size={20} color="#1F2A44" style={styles.locationChevron} />
        </TouchableOpacity>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBox}
          onPress={() => navigation.navigate("SearchMotor")}
        >
          <Ionicons name="search" size={20} color="#6B7280" />
          <Text style={styles.searchText}>Tìm kiếm địa điểm, thành phố</Text>
          <Ionicons name="options-outline" size={20} color="#4CAF50" />
        </TouchableOpacity>

        {/* Toggle */}
        <View style={styles.toggleWrapper}>
          <TouchableOpacity
            style={[styles.toggleButton, isRenting && styles.toggleButtonActive]}
            onPress={() => setIsRenting(true)}
          >
            <Text style={[styles.toggleText, isRenting && styles.toggleTextActive]}>
              Tôi muốn thuê
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !isRenting && styles.toggleButtonActive]}
            onPress={() => setIsRenting(false)}
          >
            <Text style={[styles.toggleText, !isRenting && styles.toggleTextActive]}>
              Tôi muốn cho thuê
            </Text>
          </TouchableOpacity>
        </View>

        {/* Available Motorbikes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Xe máy có sẵn</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="bicycle" size={48} color="#4CAF50" />
            <Text style={styles.loadingText}>Đang tải danh sách xe...</Text>
          </View>
        ) : contracts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có xe nào khả dụng</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollHorizontal}>
            {contracts.map((contract) => (
              <ContractCard
                key={contract.contractId}
                contract={contract}
                navigation={navigation}
              />
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ContractCard({ contract, navigation }) {
  const bike = contract.bike || {};

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("MotorbikeDetail", { contract })}
    >
      <Image
        source={{ uri: bike.imageUrl?.[0] || "https://via.placeholder.com/150" }}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>
          {`${bike.brand?.name || "Unknown"} - ${bike.name || "N/A"}`}
        </Text>
        <View style={styles.cardRatingRow}>
          <Ionicons name="star" size={14} color="#FFCA28" />
          <Text style={styles.cardRatingText}>{bike.rating || 4.5} ({bike.reviews || 30})</Text>
        </View>
        <Text style={styles.cardLocation}>Địa điểm: {bike.location?.name || "N/A"}</Text>
        <Text style={styles.cardPrice}>
          {formatCurrency(bike.pricePerDay)} <Text style={styles.cardPriceSuffix}>/ ngày</Text>
        </Text>
      </View>
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => navigation.navigate("MotorbikeDetail", { contract })}
      >
        <Text style={styles.bookButtonText}>Đặt ngay</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const formatCurrency = (value) => {
  if (!value) return "0";
  return value.toLocaleString("vi-VN");
};

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F9FB",
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2A44",
    marginTop: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: "#1F2A44",
    marginLeft: 8,
  },
  locationChevron: {
    marginLeft: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: "#6B7280",
    marginHorizontal: 8,
  },
  toggleWrapper: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 16,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#4CAF50",
  },
  toggleText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2A44",
  },
  sectionAction: {
    fontSize: 16,
    color: "#4CAF50",
  },
  scrollHorizontal: {
    paddingVertical: 8,
  },
  card: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2A44",
    marginBottom: 4,
  },
  cardRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cardRatingText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  cardLocation: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5722",
  },
  cardPriceSuffix: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#6B7280",
  },
  bookButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 10,
    margin: 12,
    alignItems: "center",
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#1F2A44",
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
};