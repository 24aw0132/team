import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ImageBackground } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

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

  // 戻るボタンの処理をindex.tsxに遷移するよう修正
  const handleBack = () => {
    router.replace('/'); // index.tsx画面に遷移
  };

  return (
    <View style={styles.container}>
      {/* トップ背景画像 */}
      <ImageBackground
        source={require('../assets/images/bg1.png')}
        style={styles.topBg}
        resizeMode="cover"
        imageStyle={{}}
      >
        {/* 戻るボタン */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        {/* 編集ボタン */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
        >
          <Text style={styles.editButtonText}>{isEditing ? '保存' : '編集'}</Text>
        </TouchableOpacity>
      </ImageBackground>

      {/* アバターと編集アイコン */}
      <View style={styles.avatarContainer}>
        <Image
          source={require('../assets/avatar.png')}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.avatarEditIcon}>
          <MaterialIcons name="edit" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 情報エリア */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>ニックネーム</Text>
        <TextInput
          style={styles.infoValue}
          value={nickname}
          onChangeText={setNickname}
          editable={isEditing}
        />

        <Text style={styles.infoLabel}>UID: メールアドレス</Text>
        <Text style={styles.infoValue}>{email}</Text>

        <Text style={styles.infoLabel}>誕生日</Text>
        <TextInput
          style={styles.infoValue}
          value={birthday}
          onChangeText={setBirthday}
          editable={isEditing}
        />

        <Text style={styles.infoLabel}>趣味</Text>
        <TextInput
          style={styles.infoValue}
          value={hobby}
          onChangeText={setHobby}
          editable={isEditing}
        />
      </View>
      {/* ログイン・ログアウトボタン（ユーザー状態によって表示切替） */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>
          {auth.currentUser ? 'ログアウト' : 'ログイン'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  topBg: {
    width: '100%',
    height: 260, // 放大背景图
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 32,
    left: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 24,
    padding: 10, // 押しやすいようにパディングを拡大
  },
  editButton: {
    position: 'absolute',
    top: 32,
    right: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    opacity: 0.85,
    zIndex: 2,
  },
  editButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -80, // 头像下移
    marginBottom: 24, // 增加底部间距
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  avatarEditIcon: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 2,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoBox: {
    width: '85%',
    backgroundColor: '#fafafa',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignSelf: 'center',
    alignItems: 'flex-start', // 内容左对齐
    elevation: 2,
  },
  infoLabel: {
    color: '#888',
    fontSize: 13,
    marginTop: 10,
    marginBottom: 2,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
    paddingVertical: 2,
    alignSelf: 'stretch',
    textAlign: 'left',
  },
  logoutButton: {
    width: '85%',
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 32, // 增加与内容区的距离
    marginBottom: 30,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
