import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  orderBy 
} from 'firebase/firestore';
import { useRouter } from 'expo-router';
import EmojiNotificationList from './EmojiNotificationList';

interface Notification {
  id: string;
  originalDiaryId: string; // 原始日记ID
  diaryId: string; // 协作日记ID
  diaryTitle: string;
  inviterId: string;
  inviterNickname: string;
  inviteeId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
  type: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emojiUnreadCount, setEmojiUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // 监听协作邀请通知
    const collabQuery = query(
      collection(db, 'collaboration_invites'),
      where('inviteeId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const collabUnsubscribe = onSnapshot(collabQuery, (snapshot) => {
      const notificationData: Notification[] = [];
      snapshot.forEach((doc) => {
        notificationData.push({ id: doc.id, ...doc.data() } as Notification);
      });
      
      console.log('协作通知データ更新:', notificationData);
      
      // 在客户端排序
      notificationData.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      setNotifications(notificationData);
      setUnreadCount(notificationData.length);
    });

    // 监听emoji通知
    const emojiQuery = query(
      collection(db, 'emoji_notifications'),
      where('receiverId', '==', currentUser.uid),
      where('isRead', '==', false)
    );

    const emojiUnsubscribe = onSnapshot(emojiQuery, (snapshot) => {
      setEmojiUnreadCount(snapshot.size);
    });

    return () => {
      collabUnsubscribe();
      emojiUnsubscribe();
    };
  }, []);

  const handleAcceptInvite = async (notification: Notification) => {
    try {
      // 更新邀请状态
      await updateDoc(doc(db, 'collaboration_invites', notification.id), {
        status: 'accepted'
      });

      // 导航到协作编辑页面
      router.push({
        pathname: '/simple-collaboration-edit',
        params: {
          diaryId: notification.diaryId,
          diaryTitle: notification.diaryTitle,
          inviterId: notification.inviterId,
          isCollaborator: 'true'
        }
      } as any);

      setShowModal(false);
    } catch (error) {
      console.error('招待の受諾エラー:', error);
      Alert.alert('エラー', '招待の受諾に失敗しました。もう一度お試しください');
    }
  };

  const handleDeclineInvite = async (notification: Notification) => {
    try {
      await updateDoc(doc(db, 'collaboration_invites', notification.id), {
        status: 'declined'
      });
      Alert.alert('拒否しました', 'この協同編集の招待を拒否しました');
    } catch (error) {
      console.error('招待の拒否エラー:', error);
      Alert.alert('エラー', '招待の拒否に失敗しました。もう一度お試しください');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return '刚刚';
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>協同編集の招待</Text>
        <Text style={styles.notificationText}>
          {item.inviterNickname} があなたを日記「{item.diaryTitle}」の協同編集に招待しています
        </Text>
        <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.notificationActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptInvite(item)}
        >
          <Text style={styles.acceptButtonText}>受諾</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDeclineInvite(item)}
        >
          <Text style={styles.declineButtonText}>拒否</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <TouchableOpacity 
        style={styles.bellContainer}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="notifications-outline" size={24} color="#333" />
        {(unreadCount + emojiUnreadCount) > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount + emojiUnreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>通知</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* 通知类型选择 */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={styles.tabButton}
                onPress={() => {
                  setShowModal(false);
                  setTimeout(() => setShowEmojiModal(true), 100);
                }}
              >
                <Ionicons name="heart" size={20} color="#ff6b9d" />
                <Text style={styles.tabText}>絵文字</Text>
                {emojiUnreadCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{emojiUnreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
                <Ionicons name="people" size={20} color="#4a90e2" />
                <Text style={[styles.tabText, styles.activeTabText]}>協同編集</Text>
                {unreadCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>新しい協同編集の招待はありません</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                style={styles.notificationList}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Emoji通知モーダル */}
      <EmojiNotificationList 
        visible={showEmojiModal}
        onClose={() => setShowEmojiModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationContent: {
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  // 新增的tab样式
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a90e2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff4757',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
