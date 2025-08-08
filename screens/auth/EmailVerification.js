// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';
// // import { getVerificationCode, verifyEmailCode } from '../api/authApi'; // chỉnh path nếu khác
// import styles from '../../styles/VerifyEmailStyles';

// export default function EmailVerification({route, navigation }) {
//   const { email, fullName, passcode, userType, avatar } = route.params;

//   const [code, setCode] = useState('');
//   const [isVerified, setIsVerified] = useState(false);

//   const handleSendCode = async () => {
//     try {
//       await getVerificationCode(email);
//       Alert.alert('Success', 'Verification code sent to your email');
//     } catch (err) {
//       Alert.alert('Error', err.response?.data?.message || 'Failed to resend code');
//     }
//   };

//   const handleVerify = async () => {
//     try {
//       await verifyEmailCode(email, code);
//       setIsVerified(true);
//       Alert.alert('Verified', 'Your email has been verified');
//     } catch (err) {
//       Alert.alert('Error', err.response?.data?.message || 'Invalid or expired code');
//     }
//   };

//   const handleNext = () => {
//     if (!isVerified) {
//       Alert.alert('Not verified', 'Please verify your email first');
//       return;
//     }

//     // Có thể điều hướng tới trang hoàn tất đăng ký
//     navigation.navigate('CompleteRegister', {
//       email,
//       fullName,
//       passcode,
//       userType,
//       avatar,
//     });
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Sign up</Text>
//       <Text style={styles.subtitle}>VERIFY THROUGH EMAIL</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="yourmail@example.com"
//         value={email}
//         editable={false}
//       />

//       <View style={styles.row}>
//         <TextInput
//           style={[styles.input, { flex: 1 }]}
//           placeholder="Enter code"
//           value={code}
//           onChangeText={setCode}
//           keyboardType="numeric"
//         />
//         <TouchableOpacity style={styles.codeButton} onPress={handleSendCode}>
//           <Text style={styles.buttonText}>Get code</Text>
//         </TouchableOpacity>
//       </View>

//       <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
//         <Text style={styles.buttonText}>Verify</Text>
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
//         <Text style={styles.buttonText}>Next</Text>
//       </TouchableOpacity>

//       <Text style={styles.backLink} onPress={() => navigation.goBack()}>
//         back to login
//       </Text>
//     </View>
//   );
// }
