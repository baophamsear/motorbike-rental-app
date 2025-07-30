import { StyleSheet } from 'react-native';

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 100,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    color: '#1A1446',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1A1446',
  },
  label: {
    marginTop: 24,
    marginBottom: 4,
    color: '#999',
    fontWeight: '500',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#F2F2F2',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#3366FF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  registerContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  registerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  createButton: {
    backgroundColor: '#1A1D22',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  createText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default loginStyles;
