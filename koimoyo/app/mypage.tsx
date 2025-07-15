import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Image, ImageBackground
} from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import {
  doc, getDoc, updateDoc,
  collection, query, where, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

export default function Mypage() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [hobby, setHobby] = useState('');
  const [userId, setUserId] = useState('');
  const [userDocId, setUserDocId] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, 'users'), where('authUid', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();

          setUserDocId(docSnap.id);
          setEmail(data.email || '');
          setNickname(data.nickname || '');
          setBirthday(data.birthday || '');
          setHobby(data.hobby || '');
          setUserId(data.userId || docSnap.id); // 优先字段 userId，没有则使用文档 ID
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    if (!userDocId) return;
    try {
      await updateDoc(doc(db, 'users', userDocId), {
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
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const handleBack = () => {
    router.replace('/');
  };

  const handleCopyUserId = async () => {
    await Clipboard.setStringAsync(userId);
    Alert.alert('コピー完了', 'ユーザーIDをコピーしました');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/bg1.png')}
        style={styles.topBg}
        resizeMode="cover"
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
        >
          <Text style={styles.editButtonText}>{isEditing ? '保存' : '編集'}</Text>
        </TouchableOpacity>
      </ImageBackground>

      <View style={styles.avatarContainer}>
        {/* 头像和编辑按钮重叠 */}
        <View>
          <Image
            source={require('../assets/avatar.png')}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.avatarEditIcon}>
            <MaterialIcons name="edit" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        {/* UID，点击即可复制 */}
        {userId ? (
          <TouchableOpacity onPress={handleCopyUserId}>
            <Text style={styles.uidText}>ユーザーID: {userId}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>ニックネーム</Text>
        <TextInput
          style={styles.infoValue}
          value={nickname}
          onChangeText={setNickname}
          editable={isEditing}
        />

        <Text style={styles.infoLabel}>メールアドレス</Text>
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
    flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'flex-start',
  },
  topBg: {
    width: '100%', height: 260, justifyContent: 'flex-end', alignItems: 'center',
    position: 'relative', overflow: 'hidden', marginBottom: 0,
  },
  backButton: {
    position: 'absolute', top: 32, left: 20, zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 24, padding: 10,
  },
  editButton: {
    position: 'absolute', top: 32, right: 20, backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, opacity: 0.85, zIndex: 2,
  },
  editButtonText: {
    color: '#333', fontWeight: 'bold', fontSize: 16,
  },
  avatarContainer: {
    alignItems: 'center', marginTop: -80, marginBottom: 24,
  },
  avatar: {
    width: 110, height: 110, borderRadius: 55, borderWidth: 4,
    borderColor: '#fff', backgroundColor: '#eee',
  },
  avatarEditIcon: {
    position: 'absolute', right: 10, bottom: 10, backgroundColor: '#fff',
    borderRadius: 16, padding: 2, borderWidth: 1, borderColor: '#ddd',
  },
  uidText: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 8,
  },
  copyText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  infoBox: {
    width: '85%', backgroundColor: '#fafafa', borderRadius: 16,
    padding: 24, marginBottom: 24, alignSelf: 'center', alignItems: 'flex-start', elevation: 2,
  },
  infoLabel: {
    color: '#888', fontSize: 13, marginTop: 10, marginBottom: 2, fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 16, color: '#222', borderBottomWidth: 1,
    borderBottomColor: '#eee', marginBottom: 8, paddingVertical: 2,
    alignSelf: 'stretch', textAlign: 'left',
  },
  logoutButton: {
    width: '85%', backgroundColor: '#222', padding: 16, borderRadius: 25,
    alignItems: 'center', alignSelf: 'center', marginTop: 32, marginBottom: 30,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
