import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Image, ImageBackground, Modal
} from 'react-native';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import {
  doc, getDoc, updateDoc, collection,
  query, where, getDocs
} from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uploadToCloudinary from '../utils/cloudinary'; // ✅ 使用 Cloudinary

export default function Mypage() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [hobby, setHobby] = useState('');
  const [userId, setUserId] = useState('');
  const [userDocId, setUserDocId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [partnerInput, setPartnerInput] = useState('');

  const router = useRouter();
  const PARTNER_UID_KEY = 'PARTNER_UID';

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

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
        setUserId(data.userId || docSnap.id);
        setAvatarUrl(data.avatarUrl || '');
        setBackgroundUrl(data.backgroundUrl || '');
      }

      const localPartnerUid = await AsyncStorage.getItem(PARTNER_UID_KEY);
      if (localPartnerUid) {
        const q = query(collection(db, 'users'), where('authUid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          if (!data.partnerId) {
            await AsyncStorage.removeItem(PARTNER_UID_KEY);
          }
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    if (!userDocId) return;
    try {
      await updateDoc(doc(db, 'users', userDocId), {
        nickname, birthday, hobby,
      });
      Alert.alert('保存成功', 'プロフィールを更新しました');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('エラー', '更新に失敗しました');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(PARTNER_UID_KEY);
    await signOut(auth);
    router.replace('/login');
  };

  const handleBack = () => {
    // 直接返回主页，不经过引导页
    router.replace('/(tabs)');
  };

  const handleCopyUserId = async () => {
    await Clipboard.setStringAsync(userId);
    Alert.alert('コピー完了', 'ユーザーIDをコピーしました');
  };

  // Cloudinary 上传图片通用方法
  const handlePickImage = async (type: 'avatar' | 'background') => {
    console.log('handlePickImage called with type:', type);
    
    // 请求权限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('Permission status:', status);
    
    if (status !== 'granted') {
      Alert.alert('権限が必要です', 'フォトライブラリへのアクセス権限を許可してください');
      return;
    }

    console.log('Launching image picker...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    console.log('Image picker result:', result);

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      const uploadedUrl = await uploadToCloudinary(uri);
      if (!uploadedUrl) {
        Alert.alert('アップロード失敗', 'Cloudinary へのアップロードに失敗しました');
        return;
      }

      await updateDoc(doc(db, 'users', userDocId), {
        [`${type}Url`]: uploadedUrl,
      });

      type === 'avatar' ? setAvatarUrl(uploadedUrl) : setBackgroundUrl(uploadedUrl);
    }
  };

  const handlePairWithPartner = async () => {
    if (!partnerInput) {
      Alert.alert('ユーザーIDを入力してください');
      return;
    }

    try {
      const q = query(collection(db, 'users'), where('userId', '==', partnerInput));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        Alert.alert('相手が見つかりません');
        return;
      }

      const partnerDoc = querySnapshot.docs[0];
      const partnerData = partnerDoc.data();

      await AsyncStorage.setItem(PARTNER_UID_KEY, partnerData.authUid);

      await updateDoc(doc(db, 'users', userDocId), {
        partnerId: partnerData.userId,
      });
      await updateDoc(doc(db, 'users', partnerDoc.id), {
        partnerId: userId,
      });

      Alert.alert('成功', `${partnerData.nickname || '相手'}さんとペアリングしました`);
      setPartnerInput('');
    } catch (e) {
      Alert.alert('エラー', 'ペアリングに失敗しました');
    }
  };

  const fetchPartnerInfo = async () => {
    try {
      const partnerAuthUid = await AsyncStorage.getItem(PARTNER_UID_KEY);
      if (!partnerAuthUid) {
        Alert.alert('まだペアリングしていません');
        return;
      }
      const q = query(collection(db, 'users'), where('authUid', '==', partnerAuthUid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setPartnerInfo(data);
        setModalVisible(true);
      } else {
        Alert.alert('相手が見つかりません');
      }
    } catch (e) {
      Alert.alert('エラー', '相手情報の取得に失敗しました');
    }
  };

  // 在 mypage.tsx 中添加重置功能（仅用于开发测试）
  const resetIntroStatus = async () => {
    try {
      await AsyncStorage.removeItem('INTRO_SEEN');
      Alert.alert('重置完成', '下次启动将显示引导页');
    } catch (error) {
      console.error('Error resetting intro status:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={backgroundUrl ? { uri: backgroundUrl } : require('../assets/images/bg1.png')}
        style={styles.topBg}
        resizeMode="cover"
      >
        {/* 提高背景点击区域的 zIndex */}
        <TouchableOpacity 
          style={[styles.topBgTouchable, { zIndex: 5 }]} 
          onPress={() => {
            console.log('Background touched!');
            handlePickImage('background');
          }} 
        />
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editButton} onPress={isEditing ? handleSave : () => setIsEditing(true)}>
          <Text style={styles.editButtonText}>{isEditing ? '保存' : '編集'}</Text>
        </TouchableOpacity>
      </ImageBackground>

      <View style={styles.avatarContainer}>
        {/* 添加调试和提高 zIndex */}
        <TouchableOpacity 
          style={{ zIndex: 10 }}
          onPress={() => {
            console.log('Avatar touched!');
            handlePickImage('avatar');
          }}
        >
          <Image
            source={avatarUrl ? { uri: avatarUrl } : require('../assets/avatar.png')}
            style={styles.avatar}
          />
          <View style={styles.avatarEditIcon}>
            <MaterialIcons name="edit" size={24} color="#333" />
          </View>
        </TouchableOpacity>
        {userId && (
          <TouchableOpacity onPress={handleCopyUserId}>
            <Text style={styles.uidText}>ユーザーID: {userId}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>プロフィール情報</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>ニックネーム</Text>
          {isEditing ? (
            <TextInput
              style={styles.infoInput}
              value={nickname}
              onChangeText={setNickname}
            />
          ) : (
            <Text style={styles.infoText}>{nickname}</Text>
          )}
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>誕生日</Text>
          {isEditing ? (
            <TextInput
              style={styles.infoInput}
              value={birthday}
              onChangeText={setBirthday}
            />
          ) : (
            <Text style={styles.infoText}>{birthday}</Text>
          )}
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>趣味</Text>
          {isEditing ? (
            <TextInput
              style={styles.infoInput}
              value={hobby}
              onChangeText={setHobby}
            />
          ) : (
            <Text style={styles.infoText}>{hobby}</Text>
          )}
        </View>
      </View>

      <View style={styles.pairBox}>
        <Text style={styles.pairTitle}>ペアリング</Text>
        <TouchableOpacity style={styles.pairButton} onPress={fetchPartnerInfo}>
          <Text style={styles.pairButtonText}>相手の情報を見る</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.partnerInput}
          placeholder="相手のユーザーIDを入力"
          value={partnerInput}
          onChangeText={setPartnerInput}
        />
        <TouchableOpacity style={styles.pairButton} onPress={handlePairWithPartner}>
          <Text style={styles.pairButtonText}>ペアリングする</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>相手のプロフィール</Text>
            {partnerInfo && (
              <>
                <Image
                  source={partnerInfo.avatarUrl ? { uri: partnerInfo.avatarUrl } : require('../assets/avatar.png')}
                  style={styles.modalAvatar}
                />
                <Text style={styles.modalNickname}>{partnerInfo.nickname}</Text>
                <Text style={styles.modalText}>ユーザーID: {partnerInfo.userId}</Text>
                <Text style={styles.modalText}>誕生日: {partnerInfo.birthday}</Text>
                <Text style={styles.modalText}>趣味: {partnerInfo.hobby}</Text>
              </>
            )}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
{auth.currentUser ? (
  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
    <Text style={styles.logoutText}>ログアウト</Text>
  </TouchableOpacity>
) : (
  <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/login')}>
    <Text style={styles.loginButtonText}>ログイン</Text>
  </TouchableOpacity>
)}
      {/* <TouchableOpacity onPress={resetIntroStatus}>
        <Text>重置引导页状态</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topBg: {
    width: '100%',
    height: 260,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  topBgTouchable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5, // 提高 zIndex
  },
  backButton: {
    position: 'absolute',
    top: 32,
    left: 20,
    zIndex: 10, // 确保按钮在最上层
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 24,
    padding: 10,
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
    zIndex: 10, // 确保按钮在最上层
  },
  editButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -80,
    marginBottom: 24,
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
  uidText: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 8,
  },
  infoBox: {
    width: '90%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#555',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  infoInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pairBox: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pairTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pairButton: {
    backgroundColor: '#007bff',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  pairButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  partnerInput: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#007bff',
    marginBottom: 12,
  },
  modalNickname: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  modalCloseButton: {
    marginTop: 12,
    backgroundColor: '#007bff',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  loginButton: {
  width: '85%',
  backgroundColor: '#007AFF',
  padding: 16,
  borderRadius: 25,
  alignItems: 'center',
  alignSelf: 'center',
  marginTop: 20,
  marginBottom: 30,
},
loginButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
logoutButton: {
  width: '85%',
  backgroundColor: '#222',
  padding: 16,
  borderRadius: 25,
  alignItems: 'center',
  alignSelf: 'center',
  marginTop: 20,
  marginBottom: 30,
},
logoutText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},


});


