import React, { useEffect, useState } from "react";
import MapView, { Marker } from 'react-native-maps';
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Button,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuthApi } from "../../utils/useAuthApi";
import { endpoints } from "../../configs/APIs";
import { useNavigation } from "@react-navigation/native";



export default function ContractManagement() {
  const navigation = useNavigation();
  const [contracts, setContracts] = useState([]);



  const fetchContracts = async () => {
    try {
      const api = await getAuthApi();
      const response = await api.get(endpoints["myContracts"]);
      console.log("Fetched contracts:", response);
      setContracts(response.data);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);


  const renderItem = ({ item }) => {
    const {
      contractId,
      lessor,
      bike,
      serviceFee,
      startDate,
      endDate,
    } = item;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="bar-chart-outline" size={24} color="#4f46e5" />
          <View style={{ marginLeft: 10 }}>

            <Text style={styles.contractId}>Mã hợp đồng: {contractId}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: item.status === "pending" ? "#e00a0aff" : "#ede9fe", marginLeft: "70"
              },
            ]}
            onPress={() => {
              // 👉 xử lý khi người dùng bấm nút
              navigation.navigate("ContractEdit", { contract: item })
            }}
          >
            <Text
              style={[
                styles.actionText,
                { color: item.status === "pending" ? "#ffffff" : "#7c3aed", fontSize: 15 },
              ]}
            >
              {item.status === "pending" ? "Khởi tạo hợp đồng" : "Cập nhật hợp đồng"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tags */}
        <View style={styles.tagContainer}>
          <View style={[styles.tag, { backgroundColor: "#10b981" }]}>
            <Text style={styles.tagText}>{item.bike?.brand?.name}</Text>
          </View>
          {/* <View style={[styles.tag, { backgroundColor: "#10b981" }]}>
            <Text style={styles.tagText}>Pending Signature</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: "#f59e0b" }]}>
            <Text style={styles.tagText}>Own</Text>
          </View> */}
        </View>

        {/* Amount */}
        <Text style={styles.amount}>
          <Text style={{ fontWeight: "bold" }}>Giá chiết khấu sàn: {serviceFee?.toLocaleString()} VND</Text>
        </Text>

        <View style={styles.divider} />

        {/* Info rows */}

        <View style={styles.infoRow}>
          <Ionicons name="person-circle-outline" size={20} color="#6366f1" />
          <Text style={styles.infoText}>Chủ xe: {bike?.owner?.fullName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#6366f1" />
          <Text style={styles.infoText}>
            {startDate} - {endDate}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#6366f1" />
          <Text style={styles.infoText}>{bike?.location?.name}</Text>
        </View>
        {item.status === "pending" && (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              ⚠️ Cần khởi tạo hợp đồng để có thể bắt đầu hoạt động hợp đồng.
            </Text>
          </View>
        )}

        
      </View>



    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={contracts}
        renderItem={renderItem}
        keyExtractor={(item) => item.contractId.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 16,


  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    margin: 16
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#1f2937",
  },
  contractId: {
    color: "#000",
    fontSize: 15,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 6,
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
  },
  amount: {
    fontSize: 16,
    color: "#111827",
    marginBottom: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: "#000",
    fontSize: 15,
  },
  noticeBox: {
    backgroundColor: "#fef3c7", // màu vàng nhạt
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  noticeText: {
    color: "#92400e", // cam đậm
    fontSize: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },

  
});
