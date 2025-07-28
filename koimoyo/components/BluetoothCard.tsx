import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  Animated,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { auth } from '../firebase';

interface BluetoothCardProps {
  isEnabled: boolean;
}

const UID_KEY = 'PARTNER_UID';
const CONNECT_COUNT_KEY = 'CONNECT_COUNT';

const BluetoothCard: React.FC<BluetoothCardProps> = ({ isEnabled }) => {
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [partnerUid, setPartnerUid] = useState('');
  const [inputVisible, setInputVisible] = useState(false);
  const [inputUid, setInputUid] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paired, setPaired] = useState(false);
  const [connectCount, setConnectCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [partnerNickname, setPartnerNickname] = useState('');
  const [canGoDiary, setCanGoDiary] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatar, setUserAvatar] = useState('');
  const [partnerAvatar, setPartnerAvatar] = useState('');
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  useEffect(() => {
    initializeComponent();
  }, []);

  // 初始化组件
  const initializeComponent = async () => {
    setIsLoading(true);
    await checkAuthAndPairing();
    setIsLoading(false);
  };

  // 检查登录状态和配对状态
  const checkAuthAndPairing = async () => {
    try {
      const user = auth.currentUser;
      console.log('Auth state check:', { user: user?.uid, isLoggedIn });
      
      if (!user) {
        console.log('No user found, resetting states');
        setIsLoggedIn(false);
        resetStates();
        return;
      }
      
      console.log('User is logged in:', user.uid);
      setIsLoggedIn(true);
      
      // 先获取日记数量，再检查配对状态
      await fetchDiaryCount();
      await checkExistingPartner();
      
    } catch (error) {
      console.error('Error in checkAuthAndPairing:', error);
      setIsLoggedIn(false);
      resetStates();
    }
  };

  // 重置状态
  const resetStates = () => {
    setIsFirstTime(true);
    setPaired(false);
    setShowHeart(false);
    setCanGoDiary(false);
    setPartnerNickname('');
    setPartnerUid('');
    setConnectCount(0);
  };

  // 检查现有配对关系
  const checkExistingPartner = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      console.log('Checking existing partner for user:', user.uid);

      // 从Firebase检查配对状态
      const q = query(collection(db, 'users'), where('authUid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const partnerId = userData.partnerId;
        const userAvatarUrl = userData.avatarUrl || '';
        
        console.log('User data:', userData);
        console.log('Partner ID:', partnerId);
        
        // 设置当前用户头像
        setUserAvatar(userAvatarUrl);
        
        if (partnerId) {
          // 已配对
          await handleExistingPartner(partnerId);
        } else {
          // 未配对
          handleNoPartner();
        }
      } else {
        console.log('User document not found');
        handleNoPartner();
      }
    } catch (error) {
      console.error('Error checking existing partner:', error);
      handleNoPartner();
    }
  };

  // 处理已配对情况
  const handleExistingPartner = async (partnerId: string) => {
    try {
      console.log('Handling existing partner:', partnerId);
      
      // 获取伙伴信息
      const partnerQuery = query(collection(db, 'users'), where('userId', '==', partnerId));
      const partnerSnapshot = await getDocs(partnerQuery);
      
      if (!partnerSnapshot.empty) {
        const partnerData = partnerSnapshot.docs[0].data();
        const partnerAuthUid = partnerData.authUid;
        const nickname = partnerData.nickname || 'パートナー';
        const partnerAvatarUrl = partnerData.avatarUrl || '';
        
        console.log('Partner data:', partnerData);
        
        // 更新状态
        setIsFirstTime(false);
        setPaired(true);
        setShowHeart(true);
        setCanGoDiary(true);
        setPartnerNickname(nickname);
        setPartnerUid(partnerAuthUid);
        setPartnerAvatar(partnerAvatarUrl);
        
        // 保存到本地存储
        await AsyncStorage.setItem(UID_KEY, partnerAuthUid);
        
        console.log('Partner setup complete:', nickname);
      } else {
        console.log('Partner document not found');
        handleNoPartner();
      }
    } catch (error) {
      console.error('Error handling existing partner:', error);
      handleNoPartner();
    }
  };

  // 处理未配对情况
  const handleNoPartner = () => {
    console.log('No partner found');
    setIsFirstTime(true);
    setPaired(false);
    setShowHeart(false);
    setCanGoDiary(false);
    setPartnerNickname('');
    setPartnerUid('');
  };

  // 获取日记数量作为连接次数
  const fetchDiaryCount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user for diary count');
        setConnectCount(0);
        return;
      }

      console.log('Fetching diary count for user:', user.uid);

      // 尝试从多个可能的集合和字段获取数据
      const queries = [
        // 尝试 diaries 集合
        { collection: 'diaries', field: 'authorUid', value: user.uid },
        { collection: 'diaries', field: 'uid', value: user.uid },
        { collection: 'diaries', field: 'userId', value: user.uid },
        // 尝试 entries 集合（如果存在）
        { collection: 'diary_entries', field: 'authorUid', value: user.uid },
        { collection: 'diary_entries', field: 'uid', value: user.uid },
      ];

      let maxCount = 0;

      for (const queryInfo of queries) {
        try {
          console.log(`Trying query: ${queryInfo.collection}.${queryInfo.field} == ${queryInfo.value}`);
          const q = query(
            collection(db, queryInfo.collection), 
            where(queryInfo.field, '==', queryInfo.value)
          );
          const snapshot = await getDocs(q);
          
          console.log(`Query ${queryInfo.collection}.${queryInfo.field}: ${snapshot.size} documents`);
          
          if (snapshot.size > 0) {
            maxCount = Math.max(maxCount, snapshot.size);
            console.log('Found documents:', snapshot.docs.map(doc => ({
              id: doc.id,
              data: doc.data()
            })));
          }
        } catch (queryError) {
          console.log(`Query ${queryInfo.collection}.${queryInfo.field} failed:`, queryError);
        }
      }

      console.log('Final diary count:', maxCount);
      
      // 如果没有找到任何日记，设置为0但不显示错误信息
      setConnectCount(maxCount);
      await AsyncStorage.setItem(CONNECT_COUNT_KEY, maxCount.toString());
      
    } catch (error) {
      console.error('Error fetching diary count:', error);
      // 尝试从本地存储获取
      try {
        const savedCount = await AsyncStorage.getItem(CONNECT_COUNT_KEY);
        if (savedCount) {
          const count = parseInt(savedCount, 10);
          console.log('Using saved count:', count);
          setConnectCount(count);
        } else {
          setConnectCount(0);
        }
      } catch (storageError) {
        console.error('Error reading from AsyncStorage:', storageError);
        setConnectCount(0);
      }
    }
  };

  // 爱心动画
  const startHeartAnimation = () => {
    if (isHeartAnimating) return;
    
    setIsHeartAnimating(true);
    
    // 启动心形跳动动画
    Animated.sequence([
      Animated.timing(heartScaleAnim, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(heartScaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartScaleAnim, {
        toValue: 1.25,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartScaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 使用setTimeout避免在动画回调中直接更新状态
      setTimeout(() => {
        setIsHeartAnimating(false);
      }, 0);
    });
    
    // 保持原有的scaleAnim动画用于其他效果
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  };

  // 处理主按钮点击
  const handleConnect = async () => {
    console.log('handleConnect called, states:', {
      isLoggedIn,
      isFirstTime,
      inputVisible,
      paired,
      showHeart,
      canGoDiary
    });

    // 未登录时提示登录
    if (!isLoggedIn) {
      Alert.alert('ログインが必要です', 'まずログインしてペアリングを行ってください。');
      return;
    }

    // 如果是第一次且输入框未显示，显示输入框
    if (isFirstTime && !inputVisible) {
      setInputVisible(true);
      return;
    }
    
    // 如果已配对且可以写日记，跳转到日记页面
    if (paired && showHeart && canGoDiary) {
      console.log('Navigating to create-diary');
      startHeartAnimation(); // 触发心形跳动动画
      router.push('/create-diary');
      return;
    }
  };

  // 验证并保存用户ID
  const handleSaveUid = async () => {
    const trimmedUid = inputUid.trim().toUpperCase();
    
    if (!trimmedUid) {
      Alert.alert('エラー', 'ユーザーIDを入力してください。');
      return;
    }

    if (trimmedUid.length !== 6) {
      Alert.alert('エラー', 'ユーザーIDは6桁である必要があります。');
      return;
    }

    try {
      setIsPairing(true);
      console.log('Starting pairing process with ID:', trimmedUid);
      
      // 查找目标用户
      const q = query(collection(db, 'users'), where('userId', '==', trimmedUid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setIsPairing(false);
        Alert.alert('エラー', 'そのユーザーIDは存在しません。正しいIDを入力してください。');
        return;
      }

      const partnerDoc = snapshot.docs[0];
      const partnerData = partnerDoc.data();
      const partnerAuthUid = partnerData.authUid;
      const partnerNickname = partnerData.nickname || 'パートナー';
      
      // 检查是否试图与自己配对
      if (partnerAuthUid === auth.currentUser?.uid) {
        setIsPairing(false);
        Alert.alert('エラー', '自分自身とはペアリングできません。');
        return;
      }

      // 检查对方是否已经有配对
      if (partnerData.partnerId && partnerData.partnerId !== '') {
        setIsPairing(false);
        Alert.alert('エラー', 'このユーザーは既に他の人とペアリング済みです。');
        return;
      }

      console.log('Partner found:', partnerData);

      // 获取当前用户文档
      const currentUserQuery = query(collection(db, 'users'), where('authUid', '==', auth.currentUser?.uid));
      const currentUserSnapshot = await getDocs(currentUserQuery);
      
      if (currentUserSnapshot.empty) {
        setIsPairing(false);
        Alert.alert('エラー', 'ユーザー情報が見つかりません。');
        return;
      }

      const currentUserDoc = currentUserSnapshot.docs[0];
      const currentUserData = currentUserDoc.data();
      
      // 检查当前用户是否已经有配对
      if (currentUserData.partnerId && currentUserData.partnerId !== '') {
        setIsPairing(false);
        Alert.alert('エラー', '既にペアリング済みです。');
        return;
      }

      // 更新双方的配对信息
      await updateDoc(doc(db, 'users', currentUserDoc.id), {
        partnerId: partnerData.userId,
      });
      
      await updateDoc(doc(db, 'users', partnerDoc.id), {
        partnerId: currentUserData.userId,
      });

      // 保存到本地存储
      await AsyncStorage.setItem(UID_KEY, partnerAuthUid);

      // 更新状态
      setPartnerUid(partnerAuthUid);
      setPartnerNickname(partnerNickname);
      setIsFirstTime(false);
      setInputVisible(false);
      setPaired(true);
      setShowHeart(true);
      setCanGoDiary(true);
      setIsPairing(false);
      setInputUid('');
      
      // 重新获取日记数量
      await fetchDiaryCount();
      
      // 播放动画
      startHeartAnimation();
      
      console.log('Pairing successful');
      Alert.alert(
        '成功！', 
        `${partnerNickname}さんとのペアリングが完了しました！\n今すぐ日記を書いてみましょう。`,
        [{ text: 'OK', onPress: () => {} }]
      );
      
    } catch (error) {
      setIsPairing(false);
      console.error('Error in pairing process:', error);
      Alert.alert('エラー', 'ペアリング中にエラーが発生しました。もう一度お試しください。');
    }
  };

  // 取消输入
  const handleCancelInput = () => {
    setInputVisible(false);
    setInputUid('');
  };

  // 获取标题内容
  const getTitle = () => {
    if (!isLoggedIn) {
      return (
        <Text style={[styles.title, styles.disabledTitle]}>
          ログインして相手と連携しよう～
        </Text>
      );
    }
    
    if (paired && partnerNickname && userAvatar && partnerAvatar) {
      return (
        <View style={styles.avatarTitleContainer}>
          <Image 
            source={{ uri: userAvatar }} 
            style={styles.userAvatarSmall}
          />
          <Animated.Image 
            source={require('../assets/images/loveclick.gif')} 
            style={[styles.heartIcon, { transform: [{ scale: heartScaleAnim }] }]}
          />
          <Image 
            source={{ uri: partnerAvatar }} 
            style={styles.partnerAvatarSmall}
          />
        </View>
      );
    }
    
    if (paired && partnerNickname) {
      return (
        <Text style={styles.title}>
          {partnerNickname}さんと💖
        </Text>
      );
    }
    
    if (paired) {
      return (
        <Text style={styles.title}>
          連携済みのパートナー💖
        </Text>
      );
    }
    
    return (
      <Text style={styles.title}>
        相手と一緒に連携しよう～
      </Text>
    );
  };

  // 获取连接信息文本
  const getConnectInfo = () => {
    console.log('getConnectInfo debug:', { isLoggedIn, connectCount, paired });
    
    if (!isLoggedIn) {
      return 'ログインが必要です';
    }
    
    // 如果已配对，显示配对状态而不是连接次数
    if (paired && partnerNickname) {
      return `${partnerNickname}さんとペアリング中`;
    }
    
    if (paired) {
      return 'パートナーとペアリング中';
    }
    
    // 未配对时显示连接次数
    if (connectCount === 0) {
      return '日記を書いて連携しよう';
    }
    
    if (connectCount === 1) {
      return '1回連携しました';
    }
    
    return `${connectCount}回連携しました`;
  };

  // 获取按钮文本
  const getButtonText = () => {
    if (!isLoggedIn) {
      return 'ログインしてください';
    }
    
    if (paired && showHeart) {
      return 'タップして日記を書く';
    }
    
    if (isFirstTime) {
      return 'ペアリングを開始';
    }
    
    return '連携する';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>読み込み中...</Text>
          </View>
          <View style={styles.mainContent}>
            <ActivityIndicator size="large" color="#f66" />
          </View>
          <View style={styles.infoSection} />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !isEnabled && styles.disabledContainer
      ]}
      onPress={handleConnect}
      disabled={isPairing || !isEnabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* 标题区域 */}
        <View style={styles.titleSection}>
          {getTitle()}

          {!isEnabled && (
            <Text style={styles.errorText}>Bluetooth が無効です</Text>
          )}

          {!isLoggedIn && (
            <Text style={styles.loginHint}>まずログインしてください</Text>
          )}
        </View>

        {/* 主要内容区域 */}
        <View style={styles.mainContent}>
          {isPairing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#f66" />
              <Text style={styles.loadingText}>ペアリング中...</Text>
            </View>
          )}

          {inputVisible && !isPairing && isLoggedIn && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>相手のユーザーIDを入力してください</Text>
              <Text style={styles.inputHint}>6桁の英数字（例：QHH672）</Text>
              <TextInput
                value={inputUid}
                onChangeText={setInputUid}
                placeholder="QHH672"
                style={styles.input}
                placeholderTextColor="#aaa"
                autoCapitalize="characters"
                maxLength={6}
                autoFocus={true}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={handleCancelInput}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.confirmButton]} 
                  onPress={handleSaveUid}
                >
                  <Text style={styles.confirmButtonText}>ペアリング</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!inputVisible && !isPairing && isLoggedIn && (
            <View style={styles.iconSection}>
              {showHeart ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (canGoDiary) {
                      router.push('/create-diary');
                    }
                  }}
                  style={styles.heartContainer}
                >
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <Ionicons name="heart" size={48} color="#f66" />
                  </Animated.View>
                  <Text style={styles.heartText}>{getButtonText()}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.iconContainer}>
                  <Ionicons name="link-outline" size={48} color="#ccc" />
                  <Text style={styles.iconText}>{getButtonText()}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 底部信息区域 */}
        <View style={styles.infoSection}>
          {!inputVisible && !isPairing && (
            <Text style={[
              styles.connectInfo,
              !isLoggedIn && styles.disabledText
            ]}>
              {getConnectInfo()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 350,  // 固定宽度
    minHeight: 200, // 改为最小高度，让内容自适应
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20, // 统一内边距
    marginVertical: 10,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'space-between', // 改为space-between确保内容分布
    flex: 1,
  },
  titleSection: {
    alignItems: 'center',
    width: '100%',
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    alignItems: 'center',
    width: '100%',
    minHeight: 24, // 确保底部区域有最小高度
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16, // 标题下方间距
    textAlign: 'center',
    lineHeight: 26,
  },
  disabledTitle: {
    color: '#999',
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  loginHint: {
    fontSize: 14,
    color: '#f66',
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20, // 加载状态的上下间距
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12, // 加载文字与图标间距
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 4, // 确保输入区域不会太贴边
  },
  inputLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  input: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16, // 稍微调小字体
    marginBottom: 16, // 减少下方间距
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#fbb',
    fontWeight: '600',
    letterSpacing: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12, // 按钮之间间距
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#f66',
    shadowColor: '#f66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  heartContainer: {
    alignItems: 'center',
    paddingVertical: 16, // 心形图标区域的上下间距
  },
  heartText: {
    fontSize: 15,
    color: '#f66',
    marginTop: 10, // 心形图标与文字间距
    fontWeight: '500',
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 16, // 链接图标区域的上下间距
  },
  iconText: {
    fontSize: 15,
    color: '#999',
    marginTop: 10, // 链接图标与文字间距
    fontWeight: '500',
    textAlign: 'center',
  },
  connectInfo: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8, // 左右内边距，防止文字贴边
  },
  disabledText: {
    color: '#999',
  },
  avatarTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  userAvatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fbb',
  },
  partnerAvatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fbb',
  },
  heartIcon: {
    width: 20,
    height: 20,
    marginHorizontal: 6,
  },
});

export default BluetoothCard;
