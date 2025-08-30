import React from "react";
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../../assets/styles/motorDetailStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import MapboxGL from '@rnmapbox/maps';

export default function MotorbikeDetailScreen({ route }) {
    const bike = route.params?.bike; // dữ liệu truyền từ danh sách

    const latitude = bike?.locationPoint?.latitude || 10.762622;
    const longitude = bike?.locationPoint?.longitude || 106.660172;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView style={styles.container}>
                <Image source={{ uri: bike?.imageUrl[0] }} style={styles.image} />



                <View style={styles.titleSection}>
                    <Text style={styles.title}>{bike?.name || 'Xe không tên'}</Text>
                    <Ionicons name="heart-outline" size={24} color="gray" />
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="star" size={16} color="#facc15" />
                    <Text style={styles.infoText}>4.1 (66 reviews)</Text>
                    <Ionicons name="pricetag-outline" size={16} color="#555" style={styles.iconSpacing} />
                    <Text style={styles.infoText}>{bike?.brand?.name}</Text>
                    <Ionicons name="location-outline" size={16} color="#555" style={styles.iconSpacing} />
                    <Text style={styles.infoText}>{bike?.location?.name || 'N/A'}</Text>

                </View>

                <View style={styles.ownerSection}>
                    <Image source={{ uri: bike?.owner?.avatar || 'https://i.pravatar.cc/150?img=1' }} style={styles.ownerAvatar} />
                    <View>
                        <Text style={styles.ownerName}>{bike?.owner?.fullName || 'Unknown'}</Text>
                        <Text style={styles.ownerLabel}>Property owner</Text>
                    </View>
                    <TouchableOpacity style={styles.callButton}>
                        <Ionicons name="call-outline" size={20} color="#6D28D9" />
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Thông tin</Text>
                </View>
                <View style={styles.facilityList}>
                    <View style={styles.facilityItem}>
                        <Ionicons name="cash-outline" size={20} color="#6B7280" />
                        <Text style={styles.facilityText}>
                            Giá tiền: {bike?.pricePerDay ? `$${bike.pricePerDay}/ngày` : 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.facilityItem}>
                        <Ionicons name="bicycle-outline" size={20} color="#6B7280" />
                        <Text style={styles.facilityText}>
                            Giao tận nơi: {bike?.isHomeDelivery ? 'Có' : 'Không'}
                        </Text>
                    </View>
                </View>


                <View style={{ height: 200, borderRadius: 12, overflow: 'hidden', marginTop: 16 }}>
                <MapboxGL.MapView
                    style={{ flex: 1 }}
                    styleURL={MapboxGL.StyleURL.Street}
                    logoEnabled={false}
                >
                    <MapboxGL.Camera
                    zoomLevel={14}
                    centerCoordinate={[longitude, latitude]}
                    />
                    <MapboxGL.PointAnnotation
                    id="bike-location"
                    coordinate={[longitude, latitude]}
                    />
                </MapboxGL.MapView>
                </View>

                

                <TouchableOpacity style={styles.advanceButton}>
                    
                    <Text style={styles.advanceButtonTextBold}>Đặt xe và thanh toán</Text>
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Bình luận</Text>
                </View>
                <Testimonial
                    name="Bijay Shahi"
                    avatar="https://randomuser.me/api/portraits/men/75.jpg"
                    content="My wife and I had a dream of downsizing..."
                />
                <Testimonial
                    name="C_LU Pokhrel"
                    avatar="https://randomuser.me/api/portraits/women/45.jpg"
                    content="My wife & I have moved 6 times in the last 25 years..."
                />

                <View style={styles.bottomRow}>
                    <Text style={styles.bottomPrice}>$526 <Text style={styles.bottomSub}>/ month</Text></Text>
                    <TouchableOpacity style={styles.contactButton}>
                        <Text style={styles.contactText}>Contact</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function Facility({ icon, label }) {
    return (
        <View style={styles.facilityItem}>
            <Ionicons name={icon} size={20} color="#6B7280" />
            <Text style={styles.facilityText}>{label}</Text>
        </View>
    );
}

function Testimonial({ avatar, name, content }) {
    return (
        <View style={styles.testimonialCard}>
            <View style={styles.testimonialHeader}>
                <Image source={{ uri: avatar }} style={styles.testimonialAvatar} />
                <View>
                    <Text style={styles.testimonialName}>{name}</Text>
                    <View style={{ flexDirection: 'row' }}>
                        {[...Array(5)].map((_, i) => (
                            <Ionicons key={i} name="star" size={14} color="#facc15" />
                        ))}
                    </View>
                </View>
            </View>
            <Text style={styles.testimonialContent}>{content} <Text style={{ color: '#6D28D9' }}>Read more</Text></Text>
        </View>
    );
}
