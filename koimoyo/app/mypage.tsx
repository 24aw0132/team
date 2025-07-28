import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Image, Modal, SafeAreaView, Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import {
  doc, getDoc, updateDoc, collection,
  query, where, getDocs
} from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uploadToCloudinary from '../utils/cloudinary';

const { width, height } = Dimensions.get('window');

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
      setPairModalVisible(false);
      setIsPaired(true);
      setPartnerId(partnerData.userId);
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
      '配対解除確認',
      '確定要解除与对方的配對吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
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
              
              Alert.alert('成功', '配対已解除');
            } catch (error) {
              Alert.alert('エラー', '解除配対失败');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 背景装饰元素 */}
      <View style={styles.backgroundDecoration}>
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />
        <View style={styles.gradientCircle3} />
      </View>

      {isLoggedIn ? (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 头部区域 */}
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#2D3748" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>マイページ</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* 用户信息卡片 */}
          <View style={styles.profileCard}>
            {/* 背景照片区域 */}
            <View style={styles.backgroundImageContainer}>
              {backgroundUrl ? (
                <Image
                  source={{ uri: backgroundUrl }}
                  style={styles.backgroundImage}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#8BB6DB', '#F7A8B8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.backgroundImage}
                />
              )}
              <TouchableOpacity 
                style={styles.backgroundEditButton} 
                onPress={() => handlePickImage('background')}
              >
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
              {/* 渐变遮罩 */}
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.4)']}
                style={styles.backgroundGradient}
              />
            </View>

            {/* 头像和用户信息区域 */}
            <View style={styles.profileContentContainer}>
              {/* 头像区域 */}
              <TouchableOpacity onPress={() => handlePickImage('avatar')} style={styles.avatarContainer}>
                <Image
                  source={avatarUrl ? { uri: avatarUrl } : require('../assets/avatar.png')}
                  style={styles.avatar}
                />
                <View style={styles.avatarEditIcon}>
                  <Ionicons name="camera" size={16} color="#8BB6DB" />
                </View>
              </TouchableOpacity>
              
              <Text style={styles.userName}>{nickname || 'ユーザー'}</Text>
              
              <TouchableOpacity style={styles.userIdDisplay} onPress={handleCopyUserId}>
                <Text style={styles.userIdText}>ID: {userId}</Text>
                <Ionicons name="copy-outline" size={16} color="#8BB6DB" style={styles.copyIcon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 基本信息卡片 */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>基本情報</Text>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={isEditing ? handleSave : () => setIsEditing(true)}
              >
                <Ionicons 
                  name={isEditing ? "checkmark" : "pencil"} 
                  size={18} 
                  color={isEditing ? "#4CAF50" : "#8BB6DB"} 
                />
                <Text style={[styles.editButtonText, isEditing && styles.saveButtonText]}>
                  {isEditing ? '保存' : '編集'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoGroup}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ニックネーム</Text>
                {isEditing ? (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={18} color="#8BB6DB" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={nickname}
                      onChangeText={setNickname}
                      placeholder="ニックネームを入力"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
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
                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={18} color="#8BB6DB" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={birthday}
                      onChangeText={setBirthday}
                      placeholder="YYYY/MM/DD"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                ) : (
                  <Text style={styles.infoText}>{birthday || '未設定'}</Text>
                )}
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>趣味</Text>
                {isEditing ? (
                  <View style={styles.inputContainer}>
                    <Ionicons name="heart-outline" size={18} color="#8BB6DB" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={hobby}
                      onChangeText={setHobby}
                      placeholder="趣味を入力"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                ) : (
                  <Text style={styles.infoText}>{hobby || '未設定'}</Text>
                )}
              </View>
            </View>
          </View>

          {/* 配对状态卡片 */}
          <View style={styles.pairCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>💕 ペアリング</Text>
            </View>

            {isPaired ? (
              <View style={styles.pairedContainer}>
                <View style={styles.pairedStatus}>
                  <Ionicons name="heart" size={24} color="#F7A8B8" />
                  <Text style={styles.pairedText}>配対中</Text>
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
                    <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.unpairButton} onPress={handleUnpair}>
                  <Text style={styles.unpairButtonText}>配対解除</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.unpairedContainer}>
                <View style={styles.unpairedStatus}>
                  <Ionicons name="heart-dislike-outline" size={24} color="#A0AEC0" />
                  <Text style={styles.unpairedText}>未配対</Text>
                </View>
                <TouchableOpacity 
                  style={styles.pairButton} 
                  onPress={() => setPairModalVisible(true)}
                >
                  <Ionicons name="link" size={20} color="#fff" />
                  <Text style={styles.pairButtonText}>パートナーと配対する</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 操作按钮组 */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>ログアウト</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        // 未登录状态
        <View style={styles.unloggedContainer}>
          <View style={styles.unloggedContent}>
            <View style={styles.unloggedIconContainer}>
              <Ionicons name="person-circle-outline" size={100} color="#A0AEC0" />
            </View>
            <Text style={styles.unloggedTitle}>ログインが必要です</Text>
            <Text style={styles.unloggedSubtitle}>マイページを利用するには{'\n'}ログインしてください</Text>
            <TouchableOpacity style={styles.bottomLoginButton} onPress={() => setLoginModalVisible(true)}>
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.bottomLoginButtonText}>ログイン</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 配对输入弹窗 */}
      <Modal
        visible={pairModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPairModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>パートナーと配対</Text>
            <Text style={styles.modalSubtitle}>相手のユーザーIDを入力してください</Text>
            <View style={styles.modalInputContainer}>
              <Ionicons name="person-outline" size={20} color="#8BB6DB" style={styles.modalInputIcon} />
              <TextInput
                style={styles.modalInput}
                value={partnerInput}
                onChangeText={setPartnerInput}
                placeholder="ユーザーIDを入力"
                placeholderTextColor="#A0AEC0"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setPairModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                onPress={handlePairWithPartner}
              >
                <Text style={styles.modalConfirmButtonText}>配対する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 登录弹窗 */}
      <Modal
        visible={loginModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleLoginCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.loginModalIconContainer}>
              <Ionicons name="person-circle" size={60} color="#8BB6DB" />
            </View>
            <Text style={styles.modalTitle}>ログインが必要です</Text>
            <Text style={styles.modalSubtitle}>
              マイページを利用するには{'\n'}ログインしてください
            </Text>
            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleLoginPress}>
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.modalConfirmButtonText}>ログイン</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelButton} onPress={handleLoginCancel}>
              <Text style={styles.modalCancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
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
                <Text style={styles.modalUserName}>{partnerInfo.nickname}</Text>
                <Text style={styles.modalInfoText}>ユーザーID: {partnerInfo.userId}</Text>
                <Text style={styles.modalInfoText}>誕生日: {partnerInfo.birthday || '未設定'}</Text>
                <Text style={styles.modalInfoText}>趣味: {partnerInfo.hobby || '未設定'}</Text>
              </>
            )}
            <TouchableOpacity 
              style={styles.modalConfirmButton} 
              onPress={() => setPartnerProfileModalVisible(false)}
            >
              <Text style={styles.modalConfirmButtonText}>閉じる</Text>
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
    backgroundColor: '#F8FAFC',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  gradientCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(247, 168, 184, 0.3)',
    opacity: 0.6,
  },
  gradientCircle2: {
    position: 'absolute',
    top: 200,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(139, 182, 219, 0.4)',
    opacity: 0.5,
  },
  gradientCircle3: {
    position: 'absolute',
    bottom: 100,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(247, 168, 184, 0.2)',
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(139, 182, 219, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 40,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden', // 确保背景图片不超出卡片边界
    shadowColor: 'rgba(139, 182, 219, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 182, 219, 0.1)',
  },
  backgroundImageContainer: {
    position: 'relative',
    width: '100%',
    height: 140, // 稍微增加高度
    marginBottom: -50, // 让头像部分重叠背景图
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundEditButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  backgroundGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80 // 减少渐变高度
  },
  profileContentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30, // 增加顶部间距以适应头像重叠
    paddingBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
    alignSelf: 'center',
    zIndex: 2, // 确保头像在背景图之上
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarEditIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(139, 182, 219, 0.3)',
    shadowColor: 'rgba(139, 182, 219, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  userIdDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(139, 182, 219, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 182, 219, 0.2)',
    marginBottom: 20, // 添加底部间距
  },
  userIdText: {
    fontSize: 14,
    color: '#8BB6DB',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  copyIcon: {
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: 'rgba(139, 182, 219, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 182, 219, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 182, 219, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 182, 219, 0.2)',
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#8BB6DB',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#4CAF50',
  },
  infoGroup: {
    gap: 20,
  },
  infoItem: {
    // marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(139, 182, 219, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 182, 219, 0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 182, 219, 0.2)',
    shadowColor: 'rgba(139, 182, 219, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    paddingVertical: 12,
    fontWeight: '500',
  },
  pairCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: 'rgba(139, 182, 219, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 182, 219, 0.1)',
  },
  pairedContainer: {
    alignItems: 'center',
  },
  pairedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pairedText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#F7A8B8',
    fontWeight: '700',
  },
  partnerInfoButton: {
    width: '100%',
    marginBottom: 16,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 168, 184, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(247, 168, 184, 0.2)',
  },
  partnerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(247, 168, 184, 0.3)',
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
  },
  partnerUserId: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  unpairButton: {
    backgroundColor: '#F7A8B8',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#F7A8B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  unpairButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  unpairedContainer: {
    alignItems: 'center',
  },
  unpairedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  unpairedText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#A0AEC0',
    fontWeight: '600',
  },
  pairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8BB6DB',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#8BB6DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pairButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7A8B8',
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#F7A8B8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoutButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // 未登录状态样式
  unloggedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1,
  },
  unloggedContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 40,
    shadowColor: 'rgba(139, 182, 219, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 182, 219, 0.1)',
  },
  unloggedIconContainer: {
    marginBottom: 20,
  },
  unloggedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
  },
  unloggedSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    fontWeight: '500',
  },
  bottomLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8BB6DB',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#8BB6DB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bottomLoginButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: 30,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: 'rgba(139, 182, 219, 0.5)',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 182, 219, 0.1)',
  },
  loginModalIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 182, 219, 0.2)',
    marginBottom: 24,
    width: '100%',
    shadowColor: 'rgba(139, 182, 219, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalInputIcon: {
    marginRight: 12,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    paddingVertical: 12,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(160, 174, 192, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(160, 174, 192, 0.2)',
  },
  modalCancelButtonText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8BB6DB',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#8BB6DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(139, 182, 219, 0.3)',
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});
