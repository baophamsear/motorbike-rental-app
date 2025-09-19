import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getAuthApi } from "../../utils/useAuthApi";
import { endpoints } from "../../configs/APIs";

export default function MotorRentBoardScreen() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0); 
  const [hasMore, setHasMore] = useState(true); 
  const [isFetchingMore, setIsFetchingMore] = useState(false); 
  const pageSize = 5; 

  const navigation = useNavigation();

  // Tải lên danh sách hợp đồng với phân trang
  const fetchContracts = useCallback(async (pageNum, reset = false) => {
    if (!hasMore && !reset) return; 
    if (pageNum !== 0) setIsFetchingMore(true);
    else setIsLoading(true);

    try {
      const api = await getAuthApi();
      
      const response = await api.get(`${endpoints["activeContracts"]}?page=${pageNum}&size=${pageSize}`);
      const availableContracts = response.data.content.filter(
        (contract) => contract.bike?.status === 'available'
      );

      
      setContracts((prev) => (reset ? availableContracts : [...prev, ...availableContracts]));
      
      setHasMore(response.data.content.length === pageSize);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [hasMore]);

  // Làm mới danh sách hợp đồng
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    await fetchContracts(0, true);
    setRefreshing(false);
  }, [fetchContracts]);

  // Tải thêm hợp đồng khi cuộn đến cuối danh sách
  const loadMoreContracts = useCallback(() => {
    if (!isFetchingMore && hasMore) {
      setPage((prev) => prev + 1); 
    }
  }, [isFetchingMore, hasMore]);

  useEffect(() => {
    fetchContracts(page); 
  }, [page, fetchContracts]);

  const renderContractCard = ({ item }) => (
    <ContractCard contract={item} navigation={navigation} />
  );

  // Hiển thị spinner khi đang tải thêm hợp đồng
  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color="#10B981" />
      </View>
    );
  };

  if (isLoading && contracts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <Ionicons name="bicycle" size={50} color="#10B981" />
          <Text style={styles.loadingText}>Đang tải danh sách xe...</Text>
          <ActivityIndicator size="small" color="#10B981" style={styles.loadingSpinner} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeTitle}>Khám phá Rentaxo</Text>
        <Text style={styles.welcomeSubtitle}>Thuê xe máy dễ dàng, nhanh chóng</Text>
      </View>
      <View style={styles.container}>
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBox}
          onPress={() => navigation.navigate("SearchMotor")}
        >
          <Ionicons name="search" size={22} color="#6B7280" />
          <Text style={styles.searchText}>Tìm kiếm địa điểm, thành phố</Text>
          <Ionicons name="options-outline" size={22} color="#10B981" />
        </TouchableOpacity>

        {/* Available Motorbikes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Xe máy có sẵn</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>

        {contracts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Không có xe nào khả dụng</Text>
            <Text style={styles.emptySubtitle}>Hãy thử làm mới danh sách</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color="#10B981" />
              <Text style={styles.refreshButtonText}>Làm mới</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={contracts}
            renderItem={renderContractCard}
            keyExtractor={(item) => item.contractId.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#10B981"]}
                tintColor="#10B981"
              />
            }
            onEndReached={loadMoreContracts} 
            onEndReachedThreshold={0.5} // Tải thêm khi cuộn đến 50% từ cuối
            ListFooterComponent={renderFooter}
            contentContainerStyle={styles.contractList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có xe nào khả dụng</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// Component hiển thị thẻ hợp đồng
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
        <View style={styles.cardInfoRow}>
          <View style={styles.cardRatingRow}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.cardRatingText}>{bike.rating || 4.5} ({bike.reviews || 30})</Text>
          </View>
          <Text style={styles.cardLocation}>Địa điểm: {bike.location?.name || "N/A"}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>
            {formatCurrency(bike.pricePerDay)} <Text style={styles.cardPriceSuffix}>/ ngày</Text>
          </Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation.navigate("MotorbikeDetail", { contract })}
          >
            <Text style={styles.bookButtonText}>Đặt ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    padding: 20,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2A44",
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: "#1F2A44",
    marginLeft: 8,
    fontWeight: "500",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: "#6B7280",
    marginHorizontal: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2A44",
  },
  sectionAction: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "600",
  },
  contractList: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2A44",
    marginBottom: 8,
  },
  cardInfoRow: {
    marginBottom: 12,
  },
  cardRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardRatingText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  cardLocation: {
    fontSize: 14,
    color: "#6B7280",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#EF4444",
  },
  cardPriceSuffix: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
  },
  bookButton: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#1F2A44",
    marginTop: 12,
  },
  loadingSpinner: {
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2A44",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  refreshButtonText: {
    fontSize: 16,
    color: "#10B981",
    marginLeft: 8,
    fontWeight: "500",
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: "center",
  },
};