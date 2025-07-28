import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  addDoc, 
  collection, 
  serverTimestamp,
  query,
  where,
  onSnapshot,
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UrgentNotification {
  id: string;
  senderId: string;
  senderNickname: string;
  receiverId: string;
  level: number; // 1-5 催促等级
  message: string;
  createdAt: any;
  isRead: boolean;
  isIgnored?: boolean;
  type: 'urgent' | 'urgent_feedback' | 'urgent_reset';
}

// 催促消息模板
const urgentMessages = [
  "何か言いたそうだよ", // 第1次
  "ちょっと焦ってるみたい、早く何かしないと", // 第2次  
  "ちょっと怒ってるかも", // 第3次
  "もう怒ってるよ", // 第4次
  "お前何してる！早く返事して" // 第5次
];

export default function UrgentNotificationPopup() {
  const [currentNotification, setCurrentNotification] = useState<UrgentNotification | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // 获取当前用户信息
    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('error:', error);
      }
    };

    fetchUserProfile();

    // 记录当前时间，只监听此时间之后的新通知
    const startTime = new Date();

    // 监听接收到的催促通知
    const q = query(
      collection(db, 'urgent_notifications'),
      where('receiverId', '==', currentUser.uid),
      where('isRead', '==', false),
      limit(10) // 获取最近10条未读记录
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 获取所有未读通知并在客户端排序  
      const notifications = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((notification: any) => {
          // 只显示应用启动后创建的新通知
          if (notification.createdAt && notification.createdAt.seconds) {
            const notificationTime = new Date(notification.createdAt.seconds * 1000);
            return notificationTime > startTime;
          }
          return false;
        })
        .sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds);

      console.log('收到新通知数量:', notifications.length);
      
      // 显示最新的通知
      if (notifications.length > 0) {
        const latestNotification = notifications[0] as UrgentNotification;
        console.log('最新通知:', latestNotification.type, latestNotification.message);
        
        // 如果没有当前通知，或者有新的通知，则显示
        if (!currentNotification || latestNotification.id !== currentNotification.id) {
          setCurrentNotification(latestNotification);
          showNotification();
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const showNotification = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentNotification(null);
    });
  };

  const handleIgnore = async () => {
    if (!currentNotification || !userProfile) return;

    try {
      console.log('用户点击無視，通知ID:', currentNotification.id);
      
      // 标记通知为已读和被无视
      await updateDoc(doc(db, 'urgent_notifications', currentNotification.id), {
        isRead: true,
        isIgnored: true,
      });

      // 获取接收者昵称（当前用户）
      const receiverNickname = userProfile.nickname || 'パートナー';

      // 发送无视反馈给发送者
      await addDoc(collection(db, 'urgent_notifications'), {
        senderId: auth.currentUser?.uid,
        senderNickname: receiverNickname, // 当前用户（接收者）的昵称
        receiverId: currentNotification.senderId,
        level: 0, // 特殊级别表示无视反馈
        message: 'があなたの催促を無視しました',
        createdAt: serverTimestamp(),
        isRead: false,
        type: 'urgent_feedback'
      });

      console.log('無視反馈已发送');
      hideNotification();
    } catch (error) {
      console.error('无视通知错误:', error);
      Alert.alert('エラー', '操作に失敗しました');
    }
  };

  const handleUnderstand = async () => {
    if (!currentNotification || !userProfile) return;

    try {
      console.log('用户点击了解，通知ID:', currentNotification.id);
      
      // 标记通知为已读和已理解
      await updateDoc(doc(db, 'urgent_notifications', currentNotification.id), {
        isRead: true,
        isIgnored: false,
      });

      // 获取接收者昵称（当前用户）
      const receiverNickname = userProfile.nickname || 'パートナー';

      // 发送理解反馈给发送者，告知重置计数
      await addDoc(collection(db, 'urgent_notifications'), {
        senderId: auth.currentUser?.uid,
        senderNickname: receiverNickname,
        receiverId: currentNotification.senderId,
        level: -1, // 特殊级别表示理解反馈，用于重置计数
        message: 'が了解しました',
        createdAt: serverTimestamp(),
        isRead: false,
        type: 'urgent_reset'
      });

      console.log('了解反馈已发送，类型: urgent_reset');
      hideNotification();
    } catch (error) {
      console.error('error:', error);
      Alert.alert('エラー', '操作に失敗しました');
    }
  };

  if (!currentNotification) return null;

  const isIgnoreFeedback = currentNotification.type === 'urgent_feedback';
  const isResetFeedback = currentNotification.type === 'urgent_reset';

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.notificationContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            {isIgnoreFeedback || isResetFeedback ? '通知' : '催促'}
          </Text>
          
          <Text style={styles.message}>
            {isIgnoreFeedback || isResetFeedback
              ? `${currentNotification.senderNickname}${currentNotification.message}`
              : `${currentNotification.senderNickname}${currentNotification.message}`
            }
          </Text>

          <View style={styles.buttonContainer}>
            {isIgnoreFeedback || isResetFeedback ? (
              <TouchableOpacity
                style={[styles.button, styles.understandButton]}
                onPress={hideNotification}
              >
                <Text style={styles.buttonText}>了解</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.ignoreButton]}
                  onPress={handleIgnore}
                >
                  <Text style={styles.buttonText}>無視</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.understandButton]}
                  onPress={handleUnderstand}
                >
                  <Text style={styles.buttonText}>了解</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  notificationContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 40,
    maxWidth: screenWidth - 80,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b9d',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  ignoreButton: {
    backgroundColor: '#666',
  },
  understandButton: {
    backgroundColor: '#ff6b9d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
