// assets/styles/rentHomeStyles.js
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  container: {
    padding: 20,
  },
  locationLabel: {
    color: '#888',
    fontSize: 13,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationChevron: {
    marginLeft: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#eaeaea',
    borderRadius: 30,
    marginTop: 10,
  },
  toggleLeft: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  toggleLeftText: {
    color: '#fff',
    fontWeight: '600',
  },
  toggleRight: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  toggleRightText: {
    color: '#555',
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionAction: {
    color: '#6366f1',
    fontSize: 14,
  },
  subLabel: {
    fontSize: 12,
    color: '#999',
  },
  scrollHorizontal: {
    marginTop: 10,
  },
  card: {
    width: 250,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 16,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    paddingHorizontal: 10,
    marginTop: 8,
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardRatingText: {
    marginLeft: 4,
    fontSize: 13,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardLocation: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  cardRoom: {
    fontSize: 12,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardPriceSuffix: {
    fontSize: 13,
    color: '#888',
  },
});
