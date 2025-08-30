import React, { useState } from "react";
import MapView, { Marker } from 'react-native-maps';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DatePicker from "react-native-date-picker"; // ✅ Thay thế
import { useRoute } from "@react-navigation/native";
import styles from "../../assets/styles/contractEditStyles";
import { getAuthApi } from "../../utils/useAuthApi";
import { endpoints } from "../../configs/APIs";

export default function EditContractScreen() {
  const route = useRoute();
  const { contract } = route.params;

  const [paymentCycle, setPaymentCycle] = useState(contract.paymentCycle || "weekly");
  const [showCycleModal, setShowCycleModal] = useState(false);

  const [startDate, setStartDate] = useState(contract.startDate ? new Date(contract.startDate) : null);
  const [endDate, setEndDate] = useState(contract.endDate ? new Date(contract.endDate) : null);

  const [isStartOpen, setIsStartOpen] = useState(false); // ✅ Thay vì showStartPicker
  const [isEndOpen, setIsEndOpen] = useState(false);     // ✅ Thay vì showEndPicker

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState("");

  const handleMapPress = (event) => {
    setSelectedLocation(event.nativeEvent.coordinate);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const d = (date instanceof Date) ? date : new Date(date);
    return isNaN(d.getTime()) ? "-" : d.toISOString().split("T")[0];
  };

  const handleSave = async () => {
    if (!startDate || !endDate) {
      alert("Vui lòng chọn ngày bắt đầu và kết thúc.");
      return;
    }

    try {
      const api = await getAuthApi();
      const payload = {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        paymentCycle,
        locationPoint: selectedLocation ? {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: "Vị trí được chọn trên bản đồ"
        } : null
      };

      console.log("payload", payload);

      const res = await api.patch(endpoints.updateContract(contract.contractId), payload);
      alert("Cập nhật hợp đồng thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      alert("Cập nhật thất bại. Kiểm tra kết nối hoặc dữ liệu.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="bar-chart-outline" size={24} color="#4f46e5" />
            <Text style={styles.contractId}>Mã hợp đồng: {contract.contractId}</Text>
          </View>

          <View style={[styles.tag, { backgroundColor: "#10b981" }]}>
            <Text style={styles.tagText}>{contract.bike?.brand?.name}</Text>
          </View>

          <Text style={styles.price}>
            <Text style={{ fontWeight: "bold" }}>
              Giá chiết khấu sàn: {contract.serviceFee?.toLocaleString()} VND
            </Text>
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={20} color="#6366f1" />
            <Text style={styles.infoText}>Chủ xe: {contract.bike?.owner?.fullName || "(chưa có)"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#6366f1" />
            <Text style={styles.infoText}>{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#6366f1" />
            <Text style={styles.infoText}>{contract.bike?.location?.name}</Text>
          </View>

          {contract.status === "pending" && (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                ⚠️ Cần cập nhật thông tin để có thể bắt đầu hoạt động hợp đồng.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Chu kỳ thanh toán</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCycleModal(true)}>
            <Text style={styles.pickerButtonText}>
              {paymentCycle === "weekly" ? "Hàng tuần" : "Hàng tháng"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#6b7280" />
          </TouchableOpacity>

          <Modal visible={showCycleModal} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCycleModal(false)}>
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.modalOption} onPress={() => { setPaymentCycle("weekly"); setShowCycleModal(false); }}>
                  <Text style={styles.modalText}>Hàng tuần</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalOption} onPress={() => { setPaymentCycle("monthly"); setShowCycleModal(false); }}>
                  <Text style={styles.modalText}>Hàng tháng</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <View style={styles.dateRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.formLabel}>Ngày bắt đầu</Text>
              <TouchableOpacity style={styles.input} onPress={() => setIsStartOpen(true)}>
                <Text style={{ fontSize: 15, color: "#111827" }}>
                  {startDate ? formatDate(startDate) : "Chọn ngày"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Ngày kết thúc</Text>
              <TouchableOpacity style={styles.input} onPress={() => setIsEndOpen(true)}>
                <Text style={{ fontSize: 15, color: "#111827" }}>
                  {endDate ? formatDate(endDate) : "Chọn ngày"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.warningText}>⚠️ Ngày chỉ chọn được 1 lần, hãy chọn cẩn thận.</Text>

          {/* ✅ Date Pickers */}
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

          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 10.762622,
              longitude: 106.660172,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={handleMapPress}
          >
            {selectedLocation && <Marker coordinate={selectedLocation} />}
          </MapView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Lưu hợp đồng</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
