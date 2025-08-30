import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    flex: 1,
  },
  image: {
    width: "100%",
    height: 240,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  introVideoButton: {
    alignSelf: "center",
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 20,
    backgroundColor: "#ede9fe",
    borderRadius: 30,
    flexDirection: "row",
  },
  introVideoText: {
    color: "#6D28D9",
    fontSize: 14,
  },
  titleSection: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    alignItems: "center",
  },
  infoText: {
    fontSize: 13,
    color: "#555",
    marginRight: 8,
  },
  iconSpacing: {
    marginLeft: 8,
  },
  ownerSection: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  ownerName: {
    fontWeight: "bold",
  },
  ownerLabel: {
    fontSize: 12,
    color: "gray",
  },
  callButton: {
    marginLeft: "auto",
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 10,
  },
  sectionHeader: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionAction: {
    fontSize: 13,
    color: "#6D28D9",
  },
  facilityList: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "48%",
    marginVertical: 4,
  },
  facilityText: {
    fontSize: 13,
    color: "#4B5563",
  },
  map: {
    marginTop: 20,
    width: "100%",
    height: 140,
    borderRadius: 12,
    resizeMode: "cover",
  },
  publicFacilities: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 20,
  },
  descriptionText: {
    marginTop: 12,
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
  },
  advanceButton: {
    backgroundColor: "#6366F1",
    marginTop: 16,
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: "center",
  },
  advanceButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  advanceButtonTextBold: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  testimonialCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
  },
  testimonialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  testimonialName: {
    fontWeight: "bold",
  },
  testimonialContent: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: "bold",
  },
  bottomSub: {
    fontSize: 14,
    color: "gray",
  },
  contactButton: {
    backgroundColor: "#6D28D9",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  contactText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
