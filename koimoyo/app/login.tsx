import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールとパスワードを入力してください');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('ようこそ！', 'ログインに成功しました');
      router.replace('/');
    } catch (error: any) {
      let message = 'ログインに失敗しました';
      if (error.code === 'auth/user-not-found') message = 'ユーザーが見つかりません';
      else if (error.code === 'auth/wrong-password') message = 'パスワードが間違っています';
      else if (error.code === 'auth/invalid-email') message = 'メールアドレスが無効です';
      Alert.alert('エラー', message);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/icon.png')} style={styles.logo} />
      <Text style={styles.title}>こいもよう</Text>

      <Text style={styles.label}>メールアドレス</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email" />
      <Text style={styles.label}>パスワード</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>ログイン</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.registerButtonText}>アカウント作成</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  logo: { width: 60, height: 60, alignSelf: 'center' },
  title: { textAlign: 'center', fontSize: 20, marginVertical: 20 },
  label: { marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5 },
  loginButton: { backgroundColor: '#fbb', padding: 12, marginTop: 20, borderRadius: 5 },
  loginButtonText: { color: '#fff', textAlign: 'center' },
  registerButtonText: { textAlign: 'center', marginTop: 10, color: '#333' },
});
