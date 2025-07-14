import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { db } from '../firebase';
import { useRouter } from 'expo-router';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [hobby, setHobby] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !nickname || !birthday) {
      Alert.alert('エラー', 'すべての項目を入力してください');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore に書き込み
      await setDoc(doc(db, 'users', user.uid), {
        email,
        nickname,
        birthday,
        hobby
      });

      Alert.alert('登録成功', 'ようこそ！');
      router.replace('/'); // 登録成功後、トップページへ
    } catch (error: any) {
      console.error(error.code);
      let message = '登録に失敗しました';
      if (error.code === 'auth/email-already-in-use') {
        message = 'このメールアドレスはすでに使われています';
      } else if (error.code === 'auth/invalid-email') {
        message = 'メールアドレスが正しくありません';
      } else if (error.code === 'auth/weak-password') {
        message = 'パスワードは6文字以上にしてください';
      }
      Alert.alert('エラー', message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>新規登録</Text>

      <Text style={styles.label}>メールアドレス</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>パスワード</Text>
      <TextInput
        style={styles.input}
        placeholder="******"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>ニックネーム</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="たろう"
      />

      <Text style={styles.label}>誕生日</Text>
      <TextInput
        style={styles.input}
        value={birthday}
        onChangeText={setBirthday}
        placeholder="2000/01/01"
      />

      <Text style={styles.label}>趣味（任意）</Text>
      <TextInput
        style={styles.input}
        value={hobby}
        onChangeText={setHobby}
        placeholder="旅行"
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>登録する</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, marginTop: 5,
  },
  button: {
    backgroundColor: '#fbb', padding: 12, borderRadius: 25,
    alignItems: 'center', marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 16 },
});
