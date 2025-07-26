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
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { auth } from '../firebase';

interface BluetoothCardProps {
  isEnabled: boolean; // 添加类型定义
}

const UID_KEY = 'PARTNER_UID';

const BluetoothCard: React.FC<BluetoothCardProps> = ({ isEnabled }) => {
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [partnerUid, setPartnerUid] = useState('');
  const [inputVisible, setInputVisible] = useState(false);
  const [inputUid, setInputUid] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [paired, setPaired] = useState(false);
  const [connectCount, setConnectCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [partnerNickname, setPartnerNickname] = useState('');
  const [canGoDiary, setCanGoDiary] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  useEffect(() => {
    checkExistingPartner();
  }, []);

  const checkExistingPartner = async () => {
    try {
      const stored = await AsyncStorage.getItem(UID_KEY);
      if (stored) {
        setIsFirstTime(false);
        setPartnerUid(stored);
        setPaired(true);
        setShowHeart(true);
        setCanGoDiary(true);
        fetchPartnerNickname(stored);
        
        const count = await AsyncStorage.getItem('CONNECT_COUNT');
        if (count) {
          setConnectCount(parseInt(count));
        }
      }
    } catch (error) {
      console.error('Error checking existing partner:', error);
    }
  };

  const startHeartAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.6,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      })
    ]).start();
  };

  const handleConnect = async () => {
    console.log('handleConnect called, states:', {
      isFirstTime,
      inputVisible,
      paired,
      showHeart,
      canGoDiary
    });

    if (isFirstTime && !inputVisible) {
      setInputVisible(true);
      return;
    }
    
    if (paired && showHeart && canGoDiary) {
      console.log('Attempting to navigate to create-diary');
      router.push('/create-diary');
      return;
    }

    setIsPairing(true);

    // 模拟连接过程
    setTimeout(() => {
      setIsPairing(false);
      setPaired(true);
      setShowHeart(true);
      setCanGoDiary(true);
      
      const newCount = connectCount + 1;
      setConnectCount(newCount);
      AsyncStorage.setItem('CONNECT_COUNT', newCount.toString());
      
      startHeartAnimation();
    }, 2000);
  };

  // 获取伙伴昵称的函数
  const fetchPartnerNickname = async (authUid: string) => {
    try {
      const q = query(collection(db, 'users'), where('authUid', '==', authUid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setPartnerNickname(data.nickname || 'パートナー');
      }
    } catch (e) {
      console.error('Error fetching partner nickname:', e);
      setPartnerNickname('パートナー');
    }
  };

  // 保存UID后，查询昵称并建立配对关系
  const handleSaveUid = async () => {
    if (!inputUid.trim()) {
      Alert.alert('エラー', 'ユーザーIDを入力してください');
      return;
    }

    try {
      setIsPairing(true);
      
      // 查找用户
      const q = query(collection(db, 'users'), where('userId', '==', inputUid.trim()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setIsPairing(false);
        Alert.alert('エラー', 'そのユーザーは存在しません');
        return;
      }

      const partnerDoc = snapshot.docs[0];
      const partnerData = partnerDoc.data();
      const partnerAuthUid = partnerData.authUid;
      
      // 检查是否试图与自己配对
      if (partnerAuthUid === auth.currentUser?.uid) {
        setIsPairing(false);
        Alert.alert('エラー', '自分とはペアリングできません');
        return;
      }

      // 保存配对信息
      await AsyncStorage.setItem(UID_KEY, partnerAuthUid);
      
      // 更新 Firebase 中的配对信息
      const currentUserQuery = query(collection(db, 'users'), where('authUid', '==', auth.currentUser?.uid));
      const currentUserSnapshot = await getDocs(currentUserQuery);
      
      if (!currentUserSnapshot.empty) {
        const currentUserDocId = currentUserSnapshot.docs[0].id;
        await updateDoc(doc(db, 'users', currentUserDocId), {
          partnerId: partnerData.userId,
        });
        
        await updateDoc(doc(db, 'users', partnerDoc.id), {
          partnerId: currentUserSnapshot.docs[0].data().userId,
        });
      }

      setPartnerUid(partnerAuthUid);
      setIsFirstTime(false);
      setInputVisible(false);
      setIsPairing(false);
      
      // 获取昵称
      await fetchPartnerNickname(partnerAuthUid);
      
      // 完成配对
      setPaired(true);
      setShowHeart(true);
      setCanGoDiary(true);
      setConnectCount(1);
      await AsyncStorage.setItem('CONNECT_COUNT', '1');
      
      startHeartAnimation();
      Alert.alert('成功！', `${partnerData.nickname || 'パートナー'}さんとペアリングしました！`);
      
    } catch (error) {
      setIsPairing(false);
      console.error('Error saving UID:', error);
      Alert.alert('エラー', 'ペアリング中にエラーが発生しました');
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleConnect}
      disabled={isPairing || !isEnabled} // 根据 isEnabled 禁用按钮
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {paired
            ? partnerNickname
              ? `${partnerNickname}さんと💖`
              : '連携済みのパートナー💖'
            : '相手と一緒に連携しよう～'}
        </Text>

        {!isEnabled && (
          <Text style={styles.subtitle}>Bluetooth が無効です</Text>
        )}

        {isPairing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.subtitle}>
              {inputVisible ? 'ペアリング中...' : '相手を探してる...'}
            </Text>
          </View>
        )}

        {inputVisible && !isPairing && (
          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>相手のユーザーIDを入力：</Text>
            <TextInput
              value={inputUid}
              onChangeText={setInputUid}
              placeholder="例：QHH672"
              style={styles.input}
              placeholderTextColor="#aaa"
              autoCapitalize="characters"
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.btn, styles.cancelBtn]} 
                onPress={() => {
                  setInputVisible(false);
                  setInputUid('');
                }}
              >
                <Text style={styles.cancelBtnText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUid}>
                <Text style={styles.saveBtnText}>保存して連携</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!inputVisible && !isPairing && (
          <>
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
                  <Ionicons name="heart" size={36} color="#ff6b9d" />
                </Animated.View>
                <Text style={styles.heartText}>タップして日記を書く</Text>
              </TouchableOpacity>
            ) : (
              <Ionicons name="link-outline" size={36} color="#888" style={styles.linkIcon} />
            )}

            <Text style={styles.connectInfo}>
              {connectCount > 0 ? `${connectCount}回連携しました` : 'まだ連携していません'}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  inputBox: {
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '90%',
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#FFB6C1',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  heartContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  heartText: {
    fontSize: 14,
    color: '#ff6b9d',
    marginTop: 8,
    fontWeight: '500',
  },
  linkIcon: {
    marginTop: 16,
  },
  connectInfo: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default BluetoothCard;
