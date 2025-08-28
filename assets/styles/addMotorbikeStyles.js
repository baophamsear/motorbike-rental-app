import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 23,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 1,
    marginBottom: 25,
    color: '#000',
    fontFamily: 'Arial',
    fontWeight: '700',
    fontSize: 25,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 14,
    marginBottom: 4,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  half: {
    flex: 1,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginLeft: 10,
  },
  uploadText: {
    color: '#888',
    marginTop: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    flex: 1,
    color: '#444',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    },

    modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '85%',
    maxHeight: '70%',
    padding: 16,
    },

    modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    },

    modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    },

    modalItemText: {
    fontSize: 14,
    color: '#333',
    },

    modalCancel: {
    marginTop: 12,
    alignItems: 'center',
    },

    modalCancelText: {
    color: '#888',
    fontSize: 14,
    },
    uploadImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    resizeMode: 'cover',
    },
    imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    },

    previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    },
    imagePreviewContainer: {
    paddingVertical: 4,
    paddingLeft: 5,
    gap: 10, // Nếu không hỗ trợ thì dùng marginRight
    
    },

    imageWrapper: {
    position: 'relative',
    marginRight: 10,
    },

    previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    },

    deleteIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 1,
    zIndex: 1,
    },flatlistWrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderColor: '#000',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    maxHeight: 140,
    },





});

export default styles;
