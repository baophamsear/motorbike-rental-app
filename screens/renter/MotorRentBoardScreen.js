import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../../assets/styles/rentBoardStyles";
import { getAuthApi } from "../../utils/useAuthApi";
import { endpoints } from "../../configs/APIs";
import { useNavigation } from "@react-navigation/native";

export default function MotorRentBoardScreen() {
  const [contracts, setContracts] = useState([]);
  const navigation = useNavigation();

  const fetchContracts = async () => {
    try {
      const api = await getAuthApi();
      const response = await api.get(endpoints["activeContracts"]);
      setContracts(response.data);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.locationLabel}>Your current locations</Text>
        <TouchableOpacity style={styles.locationSelector}>
          <Ionicons name="location-sharp" size={16} color="black" />
          <Text style={styles.locationText}>Bouddha, Kathmandu</Text>
          <Ionicons name="chevron-down" size={16} color="black" style={styles.locationChevron} />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            placeholder="Search address, city, location"
            style={styles.searchInput}
          />
          <Ionicons name="options-outline" size={20} color="#999" />
        </View>

        <Text style={styles.welcomeTitle}>Welcome to Rentaxo</Text>

        <View style={styles.toggleWrapper}>
          <TouchableOpacity style={styles.toggleLeft}>
            <Text style={styles.toggleLeftText}>I need to rent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleRight}>
            <Text style={styles.toggleRightText}>I want to list</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available motorbikes</Text>
          <Text style={styles.sectionAction}>See all</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollHorizontal}>
          {contracts.map((contract) => (
            <ContractCard
              key={contract.contractId}
              contract={contract}
              navigation={navigation}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContractCard({ contract, navigation }) {
  const bike = contract.bike;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("MotorbikeDetail", { contract })}
      activeOpacity={0.9}
      style={styles.card}
    >
      <Image source={{ uri: bike.imageUrl?.[0] }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardRatingRow}>
          <Ionicons name="star" size={14} color="#facc15" />
          <Text style={styles.cardRatingText}>4.5 (30)</Text>
        </View>
        <Text style={styles.cardTitle}>
          {`${bike.brand?.name || "Unknown"} - ${bike.name}`}
        </Text>
        <Text style={styles.cardLocation}>Giá thuê: {bike.pricePerDay} VNĐ/ngày</Text>
        <Text style={styles.cardRoom}>Địa điểm: {bike.location?.name || "N/A"}</Text>
        <Text style={styles.cardRoom}>Chủ xe: {bike.owner?.fullName || "Unknown"}</Text>
        <Text style={styles.cardRoom}>Giao tận nhà: {bike.homeDelivery ? "Có" : "Không"}</Text>
        <Text style={styles.cardRoom}>Trạng thái hợp đồng: {contract.status}</Text>
        <Text style={styles.cardPrice}>
          Tổng phí dịch vụ: {contract.serviceFee}{" "}
          <Text style={styles.cardPriceSuffix}>VND</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}
