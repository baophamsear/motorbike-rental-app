// styles/dashboardStyles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold' },
  welcome: { fontSize: 24, fontWeight: 'bold', marginVertical: 16, fontSize: 26, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  card: { flex: 1, marginHorizontal: 4, padding: 16, borderRadius: 12, position: 'relative' },
  cardTitle: { color: 'white', fontSize: 14, marginBottom: 8 },
  circle: { position: 'absolute', top: 10, right: 10, backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24},
  circleText: { color: 'black', fontWeight: 'bold' },
  squareCard: { flex: 1, marginHorizontal: 4, backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, alignItems: 'center', shadowOpacity:0.05, elevation:2 },
  squareTitle: { fontSize: 14, marginTop: 8 },
  amount: { color: '#ef4444', fontWeight: 'bold' },
  amountView: { color: '#f59e0b', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 8, borderColor: '#d1d5db' },
  headerCell: { fontWeight: 'bold', flex: 1 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: .5, color: '#e5e7eb' },
  rowCell: { flex: 1 },
  severityDot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginVertical: 16 },
  pageButton: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 8, marginHorizontal: 4 },
  pageActive: { backgroundColor: '#e5e7eb' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderColor: '#e5e7eb' },
  navItem: { alignItems: 'center' },
});
