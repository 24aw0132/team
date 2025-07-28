import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Alert,
  StyleSheet,
  Text,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EmojiOption {
  emoji: string;
  label: string;
  message: string;
}

const emojiOptions: EmojiOption[] = [
  {
    emoji: '❤️',
    label: 'ハート',
    message: 'があなたにハートを送りました'
  },
  {
    emoji: '🔔',
    label: 'ベル',
    message: 'が日記の参加を促しています'
  },
  {
    emoji: '🍩',
    label: 'ドーナツ',
    message: 'があなたにドーナツを送りました'
  },
  {
    emoji: '💩',
    label: 'うんち',
    message: 'があなたにうんちを送りました'
  },
  {
    emoji: '🚬',
    label: 'タバコ',
    message: 'があなたにタバコを送りました'
  },
  {
    emoji: '🎁',
    label: 'プレゼント',
    message: 'があなたにプレゼントを送りました'
  },
];

export default function FloatingEmojiButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const longPressTimer = useRef<number | null>(null);

  const handlePressIn = () => {
    // 开始长按计时
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      handleLongPress();
    }, 500); // 500ms 长按触发

    // 按下动画
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    // 清除长按计时器
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // 恢复按钮大小
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    // 如果不是长按，执行普通点击
    if (!isLongPress) {
      handleNormalPress();
    }
    
    setIsLongPress(false);
  };

  const handleNormalPress = async () => {
    // 普通点击发送爱心
    await sendEmojiNotification(emojiOptions[0]);
  };

  const handleLongPress = () => {
    setIsExpanded(true);
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleEmojiSelect = async (emoji: EmojiOption) => {
    await sendEmojiNotification(emoji);
    closeMenu();
  };

  const closeMenu = () => {
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setIsExpanded(false);
    });
  };

  const sendEmojiNotification = async (emojiOption: EmojiOption) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('エラー', 'ログインが必要です');
        return;
      }

      // 获取当前用户信息
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        Alert.alert('エラー', 'ユーザー情報が見つかりません');
        return;
      }

      const userData = userDoc.data();
      const partnerUid = userData.partnerUid;

      if (!partnerUid) {
        Alert.alert('エラー', 'パートナーとペアリングしてください');
        return;
      }

      // 获取发送者昵称
      const senderNickname = userData.nickname || 'パートナー';

      // 创建通知记录
      await addDoc(collection(db, 'emoji_notifications'), {
        senderId: currentUser.uid,
        senderNickname: senderNickname,
        receiverId: partnerUid,
        emoji: emojiOption.emoji,
        message: `${senderNickname}${emojiOption.message}`,
        createdAt: serverTimestamp(),
        isRead: false,
        type: 'emoji'
      });

      Alert.alert(
        '送信完了',
        `${emojiOption.emoji} ${emojiOption.label}を送信しました！`,
        [{ text: 'OK', style: 'default' }]
      );

    } catch (error) {
      console.error('絵文字通知の送信エラー:', error);
      Alert.alert('エラー', '送信に失敗しました。もう一度お試しください');
    }
  };

  return (
    <View style={styles.container}>
      {isExpanded && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayTouch} onPress={closeMenu} />
        </View>
      )}

      {isExpanded && (
        <Animated.View 
          style={[
            styles.emojiMenu,
            {
              opacity: animatedValue,
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            }
          ]}
        >
          {emojiOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emojiButton}
              onPress={() => handleEmojiSelect(option)}
            >
              <Text style={styles.emojiText}>{option.emoji}</Text>
              <Text style={styles.emojiLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      <Animated.View style={[styles.mainButton, { transform: [{ scale: scaleValue }] }]}>
        <TouchableOpacity
          style={styles.mainButtonTouch}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <Ionicons name="heart" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: -screenHeight,
    left: -screenWidth,
    width: screenWidth * 2,
    height: screenHeight * 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 998,
  },
  overlayTouch: {
    flex: 1,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff6b9d',
    elevation: 8,
    shadowColor: '#ff6b9d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1001,
  },
  mainButtonTouch: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiMenu: {
    position: 'absolute',
    bottom: 80,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    minWidth: 200,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    zIndex: 999,
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 2,
  },
  emojiText: {
    fontSize: 24,
    marginRight: 12,
  },
  emojiLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
});
