import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useRouter } from 'expo-router';

export default function Mypage() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [hobby, setHobby] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEmail(data.email || '');
          setNickname(data.nickname || '');
          setBirthday(data.birthday || '');
          setHobby(data.hobby || '');
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          nickname,
          birthday,
          hobby,
        });
        Alert.alert('保存成功', 'プロフィールを更新しました');
        setIsEditing(false);
      } catch (error) {
        Alert.alert('エラー', '更新に失敗しました');
        console.error(error);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>マイページ</Text>

      <Text style={styles.label}>メールアドレス</Text>
      <TextInput style={styles.input} value={email} editable={false} />

      <Text style={styles.label}>ニックネーム</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        editable={isEditing}
      />

      <Text style={styles.label}>誕生日</Text>
      <TextInput
        style={styles.input}
        value={birthday}
        onChangeText={setBirthday}
        editable={isEditing}
      />

      <Text style={styles.label}>趣味</Text>
      <TextInput
        style={styles.input}
        value={hobby}
        onChangeText={setHobby}
        editable={isEditing}
      />

      <TouchableOpacity style={styles.button} onPress={isEditing ? handleSave : () => setIsEditing(true)}>
        <Text style={styles.buttonText}>{isEditing ? '保存' : '編集'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>ログアウト</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { marginTop: 10, fontWeight: 'bold' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, marginTop: 5, marginBottom: 10,
  },
  button: {
    backgroundColor: '#fbb', padding: 12,
    borderRadius: 25, alignItems: 'center', marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 16 },
  logoutButton: {
    marginTop: 20, padding: 10,
    borderWidth: 1, borderColor: '#aaa',
    borderRadius: 25, alignItems: 'center',
  },
  logoutText: { color: '#333' },
});
