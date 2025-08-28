import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0f172a',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
    marginLeft: 16,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 17,
    color: 'black',
    marginBottom: 20,
    marginLeft: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#0f172a',
  },
  time: {
    fontSize: 12,
    color: 'gray',
  },
  detail: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  viewButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bikeImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },

  bikeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  bikeInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },

  licenseImageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  licenseImage: {
    width: 80,
    height: 60,
    borderRadius: 6,
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    marginLeft: 8,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    alignSelf: 'flex-start'
  },
  bikeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  }

});
