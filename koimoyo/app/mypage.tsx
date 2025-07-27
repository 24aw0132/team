import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Image, ImageBackground, Modal, SafeAreaView
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
import uploadToCloudinary from '../utils/cloudinary';

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
  const [pairModalVisible, setPairModalVisible] = useState(false);
  const [partnerProfileModalVisible, setPartnerProfileModalVisible] = useState(false);
  const [isPaired, setIsPaired] = useState(false);
  const [partnerId, setPartnerId] = useState('');
  // 添加登录弹窗状态
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const router = useRouter();
  const PARTNER_UID_KEY = 'PARTNER_UID';

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      // 未登录时显示登录弹窗
      setIsLoggedIn(false);
      setLoginModalVisible(true);
      return;
    }

    setIsLoggedIn(true);
    fetchUserData();
  }, []);

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
      setPartnerId(data.partnerId || '');
      setIsPaired(!!data.partnerId);
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

  // 处理登录按钮点击
  const handleLoginPress = () => {
    setLoginModalVisible(false);
    router.replace('/login');
  };

  // 处理登录弹窗取消
  const handleLoginCancel = () => {
    setLoginModalVisible(false);
    router.replace('/(tabs)'); // 返回主页
  };

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
      if (!partnerId) {
        Alert.alert('まだペアリングしていません');
        return;
      }
      const q = query(collection(db, 'users'), where('userId', '==', partnerId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setPartnerInfo(data);
        setPartnerProfileModalVisible(true);
      } else {
        Alert.alert('相手が見つかりません');
      }
    } catch (e) {
      Alert.alert('エラー', '相手情報の取得に失敗しました');
    }
  };

  const handleUnpair = async () => {
    Alert.alert(
      '配对解除确认',
      '确定要解除与对方的配对吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              // 解除自己的配对
              await updateDoc(doc(db, 'users', userDocId), {
                partnerId: null,
              });
              
              // 找到对方并解除对方的配对
              if (partnerId) {
                const q = query(collection(db, 'users'), where('userId', '==', partnerId));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                  const partnerDoc = querySnapshot.docs[0];
                  await updateDoc(doc(db, 'users', partnerDoc.id), {
                    partnerId: null,
                  });
                }
              }
              
              // 清除本地状态
              setPartnerId('');
              setIsPaired(false);
              setPartnerInfo(null);
              await AsyncStorage.removeItem(PARTNER_UID_KEY);
              
              Alert.alert('成功', '配对已解除');
            } catch (error) {
              Alert.alert('エラー', '解除配对失败');
            }
          }
        }
      ]
    );
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
    <SafeAreaView style={styles.container}>
      {isLoggedIn ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 背景图区域 - 放大并包含返回按钮 */}
          <View style={styles.profileSection}>
            <ImageBackground
              source={backgroundUrl ? { uri: backgroundUrl } : require('../assets/images/bg1.png')}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              {/* 返回按钮直接放在背景图上 */}
              <TouchableOpacity style={styles.backButtonOnBg} onPress={handleBack}>
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.backgroundTouchable} 
                onPress={() => handlePickImage('background')}
              />
              <TouchableOpacity style={styles.editBackgroundButton} onPress={() => handlePickImage('background')}>
                <MaterialIcons name="edit" size={20} color="#fff" />
              </TouchableOpacity>
            </ImageBackground>
            
            {/* 头像和用户ID区域 */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={() => handlePickImage('avatar')}>
                <Image
                  source={avatarUrl ? { uri: avatarUrl } : require('../assets/avatar.png')}
                  style={styles.avatar}
                />
                <View style={styles.avatarEditIcon}>
                  <MaterialIcons name="camera-alt" size={18} color="#666" />
                </View>
              </TouchableOpacity>
              
              {/* 用户ID显示在头像下方 */}
              <TouchableOpacity style={styles.userIdDisplay} onPress={handleCopyUserId}>
                <Text style={styles.userIdText}>ID: {userId}</Text>
                <MaterialIcons name="content-copy" size={16} color="#999" style={styles.copyIcon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 基本信息卡片 - 移除用户ID部分 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>基本情報</Text>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={isEditing ? handleSave : () => setIsEditing(true)}
              >
                <MaterialIcons 
                  name={isEditing ? "check" : "edit"} 
                  size={20} 
                  color={isEditing ? "#4CAF50" : "#666"} 
                />
                <Text style={[styles.editButtonText, isEditing && styles.saveButtonText]}>
                  {isEditing ? '保存' : '編集'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ニックネーム</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="ニックネームを入力"
                />
              ) : (
                <Text style={styles.infoText}>{nickname || '未設定'}</Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>メールアドレス</Text>
              <Text style={styles.infoText}>{email}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>誕生日</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={birthday}
                  onChangeText={setBirthday}
                  placeholder="YYYY/MM/DD"
                />
              ) : (
                <Text style={styles.infoText}>{birthday || '未設定'}</Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>趣味</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={hobby}
                  onChangeText={setHobby}
                  placeholder="趣味を入力"
                />
              ) : (
                <Text style={styles.infoText}>{hobby || '未設定'}</Text>
              )}
            </View>
          </View>

          {/* 配对状态卡片 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>❤️ ペアリング状態</Text>
            </View>

            {isPaired ? (
              // 已配对状态
              <View style={styles.pairedContainer}>
                <View style={styles.pairedStatus}>
                  <MaterialIcons name="favorite" size={24} color="#FF6B6B" />
                  <Text style={styles.pairedText}>配对中</Text>
                </View>
                <TouchableOpacity 
                  style={styles.partnerInfoButton} 
                  onPress={fetchPartnerInfo}
                >
                  <View style={styles.partnerInfo}>
                    <Image
                      source={partnerInfo?.avatarUrl ? { uri: partnerInfo.avatarUrl } : require('../assets/avatar.png')}
                      style={styles.partnerAvatar}
                    />
                    <View style={styles.partnerDetails}>
                      <Text style={styles.partnerName}>{partnerInfo?.nickname || 'パートナー'}</Text>
                      <Text style={styles.partnerUserId}>ID: {partnerId}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#ccc" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.unpairButton} onPress={handleUnpair}>
                  <Text style={styles.unpairButtonText}>配对解除</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // 未配对状态
              <View style={styles.unpairedContainer}>
                <View style={styles.unpairedStatus}>
                  <MaterialIcons name="heart-broken" size={24} color="#ccc" />
                  <Text style={styles.unpairedText}>未配对</Text>
                </View>
                <TouchableOpacity 
                  style={styles.pairButton} 
                  onPress={() => setPairModalVisible(true)}
                >
                  <MaterialIcons name="link" size={20} color="#fff" />
                  <Text style={styles.pairButtonText}>パートナーと配对する</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 设置按钮组 */}
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <MaterialIcons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText2}>情報を保存</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>ログアウト</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        // 未登录时显示简化版本
        <View style={styles.unloggedContainer}>
          <View style={styles.unloggedContent}>
            <MaterialIcons name="account-circle" size={100} color="#ccc" />
            <Text style={styles.unloggedTitle}>ログインが必要です</Text>
            <Text style={styles.unloggedSubtitle}>マイページを利用するにはログインしてください</Text>
            <TouchableOpacity style={styles.bottomLoginButton} onPress={() => setLoginModalVisible(true)}>
              <MaterialIcons name="login" size={20} color="#fff" />
              <Text style={styles.bottomLoginButtonText}>ログイン</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 登录弹窗 */}
      <Modal
        visible={loginModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleLoginCancel}
      >
        <TouchableOpacity 
          style={styles.loginModalOverlay} 
          activeOpacity={1} 
          onPress={handleLoginCancel}
        >
          <View style={styles.loginModalContent}>
            <MaterialIcons name="account-circle" size={60} color="#007AFF" />
            <Text style={styles.loginModalTitle}>ログインが必要です</Text>
            <Text style={styles.loginModalSubtitle}>
              マイページを利用するには{'\n'}ログインしてください
            </Text>
            <TouchableOpacity style={styles.loginModalButton} onPress={handleLoginPress}>
              <MaterialIcons name="login" size={20} color="#fff" />
              <Text style={styles.loginModalButtonText}>ログイン</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginModalCancelButton} onPress={handleLoginCancel}>
              <Text style={styles.loginModalCancelText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 对方资料弹窗 */}
      <Modal
        visible={partnerProfileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPartnerProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>パートナーのプロフィール</Text>
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
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setPartnerProfileModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6F4', // 改为与index.tsx一致的背景色
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: 320, // 增加高度让背景更大
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  // 背景图上的返回按钮
  backButtonOnBg: {
    position: 'absolute',
    top: 40, // 调整位置，让背景顶格
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.8)', // 改为白色半透明，更符合风格
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backgroundTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  editBackgroundButton: {
    position: 'absolute',
    top: 40, // 与返回按钮对齐
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.8)', // 改为白色半透明
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -60, // 调整头像位置
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarEditIcon: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 6,
    borderWidth: 1,
    borderColor: '#fbb', // 使用粉色边框，与主题一致
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // 头像下方的用户ID显示
  userIdDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,187,187,0.15)', // 使用粉色调，与主题一致
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,187,187,0.3)',
  },
  userIdText: {
    fontSize: 14,
    color: '#f66', // 使用主题色
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  copyIcon: {
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20, // 与index.tsx的padding保持一致
    marginBottom: 20,
    borderRadius: 16, // 更圆润的角
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f66', // 使用主题色
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,102,102,0.1)', // 粉色背景
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#f66',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#4CAF50',
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoInput: {
    fontSize: 16,
    color: '#333',
    borderWidth: 2,
    borderColor: '#fbb', // 粉色边框
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    fontWeight: '500',
  },
  pairedContainer: {
    alignItems: 'center',
  },
  pairedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pairedText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#f66', // 使用主题色
    fontWeight: 'bold',
  },
  partnerInfoButton: {
    width: '100%',
    marginBottom: 16,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,223,223,0.3)', // 浅粉色背景
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,187,187,0.3)',
  },
  partnerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fbb',
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  partnerUserId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  unpairButton: {
    backgroundColor: '#f66', // 使用主题色
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#f66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  unpairButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  unpairedContainer: {
    alignItems: 'center',
  },
  unpairedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  unpairedText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#ccc',
  },
  pairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f66', // 使用主题色
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#f66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pairButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 40, // 增加底部间距
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText2: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f66', // 使用主题色
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#f66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f66', // 使用主题色
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#fbb', // 粉色边框
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#f66', // 使用主题色
    borderRadius: 12,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#fbb', // 粉色边框
  },
  modalNickname: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalCloseButton: {
    backgroundColor: '#f66', // 使用主题色
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 未登录状态样式
  unloggedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unloggedContent: {
    alignItems: 'center',
  },
  unloggedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f66', // 使用主题色
    marginTop: 20,
    marginBottom: 10,
  },
  unloggedSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  bottomLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f66', // 使用主题色
    borderRadius: 25,
    paddingHorizontal: 40,
    paddingVertical: 15,
    shadowColor: '#f66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomLoginButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // 登录弹窗样式
  loginModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  loginModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f66', // 使用主题色
    marginTop: 15,
    marginBottom: 10,
  },
  loginModalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  loginModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f66', // 使用主题色
    borderRadius: 25,
    paddingHorizontal: 35,
    paddingVertical: 12,
    marginBottom: 15,
  },
  loginModalButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginModalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loginModalCancelText: {
    color: '#666',
    fontSize: 16,
  },
});


