import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

interface EmojiNotification {
  id: string;
  senderId: string;
  senderNickname: string;
  receiverId: string;
  emoji: string;
  message: string;
  createdAt: any;
  isRead: boolean;
  type: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function EmojiNotificationList({ visible, onClose }: Props) {
  const [notifications, setNotifications] = useState<EmojiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // 监听当前用户的emoji通知
    const q = query(
      collection(db, 'emoji_notifications'),
      where('receiverId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationList: EmojiNotification[] = [];
      snapshot.forEach((doc) => {
        notificationList.push({ id: doc.id, ...doc.data() } as EmojiNotification);
      });
      setNotifications(notificationList);
      setLoading(false);
    }, (error) => {
      console.error('絵文字通知の取得エラー:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [visible]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'emoji_notifications', notificationId), {
        isRead: true
      });
    } catch (error) {
      console.error('通知の既読マークエラー:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'emoji_notifications', notificationId));
      Alert.alert('削除完了', '通知を削除しました');
    } catch (error) {
      console.error('通知の削除エラー:', error);
      Alert.alert('エラー', '通知の削除に失敗しました');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}分前`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}時間前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const renderNotificationItem = ({ item }: { item: EmojiNotification }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.emojiText}>{item.emoji}</Text>
        <View style={styles.messageContent}>
          <Text style={[styles.messageText, !item.isRead && styles.unreadText]}>
            {item.message}
          </Text>
          <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.id)}
        >
          <Ionicons name="close" size={18} color="#999" />
        </TouchableOpacity>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>絵文字通知</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>通知はありません</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
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
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    maxHeight: 400,
  },
  notificationItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  unreadItem: {
    backgroundColor: '#fff0f5',
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b9d',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 32,
    marginRight: 16,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b9d',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
