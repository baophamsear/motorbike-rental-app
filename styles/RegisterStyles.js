import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a52',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 30,
    color: '#444',
  },
  signUp: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1a1a52',
    marginTop: 50
  },
  needMore: {
    fontSize: 25,
    textAlign: 'center',
    marginBottom: 20,
    color: '#444',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  avatarPlaceholder: {
    color: '#888',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  userTypeLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 12,
    marginBottom: 4,
  },
  radioContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1a1a52',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#1a1a52',
  },
  radioText: {
    fontSize: 16,
    color: '#1a1a52',
  },
  button: {
    backgroundColor: '#3559E0',
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22
  },
  backToLogin: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
  },
});

export default styles;
