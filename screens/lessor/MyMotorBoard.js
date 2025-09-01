import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import styles from '../../assets/styles/motorBoardStyles';

const complaints = [
  { name: 'Ramesh D.', complaint: 'Water tank leakage...', severity: 'green' },
  { name: 'Cabin K.', complaint: 'Elevator shaking ...', severity: 'blue' },
  { name: 'Tylor S.', complaint: 'Parking area is ...', severity: 'orange' },
  { name: 'Micheal J.', complaint: 'No water since Monday...', severity: 'red' },
];

export default function DashboardScreen() {
  const nav = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity>
            <Ionicons name="menu" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <Text style={styles.welcome}>Welcome, Bimal</Text>

        {/* Quick Access Cards */}
        <View style={styles.infoRow}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: '#10b981' }]}
            onPress={() => nav.navigate('MotorManagement')}
          >
            <Text style={styles.cardTitle}>My Bikes</Text>
            <View style={styles.circle}>
              <Text style={styles.circleText}>8</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: '#f87171' }]}
            onPress={() => nav.navigate('ContractManagement')}
          >
            <Text style={styles.cardTitle}>My Contracts</Text>
            <View style={styles.circle}>
              <Text style={styles.circleText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.infoRow}>
          <View style={styles.squareCard}>
            <FontAwesome name="money" size={30} color="black" />
            <Text style={styles.squareTitle}>Payment Received</Text>
            <Text style={styles.amount}>$25,001</Text>
          </View>
          <View style={styles.squareCard}>
            <Ionicons name="eye" size={30} color="#3b82f6" />
            <Text style={styles.squareTitle}>Total Views</Text>
            <Text style={styles.amountView}>1,500,055</Text>
          </View>
        </View>

        {/* Complaints Table */}
        <Text style={styles.sectionTitle}>Complaints</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>Tenant</Text>
          <Text style={styles.headerCell}>Complaints</Text>
          <Text style={styles.headerCell}>Severity</Text>
        </View>

        {complaints.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.rowCell}>{item.name}</Text>
            <Text style={styles.rowCell}>{item.complaint}</Text>
            <Text style={[styles.rowCell, { color: item.severity }]}>●</Text>
          </View>
        ))}

        {/* Pagination */}
        <View style={styles.pagination}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.pageButton, num === 1 && styles.pageActive]}
            >
              <Text>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
