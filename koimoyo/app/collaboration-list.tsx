import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

interface SimpleCollaborationDiary {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  createdAt: any;
}

interface CollaborationDiary {
  id: string;
  title: string;
  inviterContent?: string;
  collaboratorContent?: string;
  inviterImages?: string[];
  collaboratorImages?: string[];
  inviterId: string;
  collaboratorId?: string;
  status: string;
  updatedAt: any;
}

export default function SimpleCollaborationList() {
  const router = useRouter();
  const [diaries, setDiaries] = useState<SimpleCollaborationDiary[]>([]);
  const [collaborationDiaries, setCollaborationDiaries] = useState<CollaborationDiary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // 监听简单协作日记
    const q1 = query(
      collection(db, 'simple_collaboration_diaries'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const diaryData: SimpleCollaborationDiary[] = [];
      snapshot.forEach((doc) => {
        diaryData.push({ id: doc.id, ...doc.data() } as SimpleCollaborationDiary);
      });
      setDiaries(diaryData);
    }, (error) => {
      console.error('加载简单协作日记错误:', error);
    });

    // 监听正式协作日记
    const q2 = query(
      collection(db, 'collaboration_diaries'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const collaborationData: CollaborationDiary[] = [];
      snapshot.forEach((doc) => {
        collaborationData.push({ id: doc.id, ...doc.data() } as CollaborationDiary);
      });
      setCollaborationDiaries(collaborationData);
      setLoading(false);
    }, (error) => {
      console.error('加载协作日记错误:', error);
      setLoading(false);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>协作日记列表</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 正式协作日记部分 */}
        <Text style={styles.sectionTitle}>协作日记 (collaboration_diaries)</Text>
        {collaborationDiaries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>暂无协作日记</Text>
          </View>
        ) : (
          collaborationDiaries.map((diary) => (
            <View key={diary.id} style={styles.diaryCard}>
              <Text style={styles.diaryTitle}>{diary.title}</Text>
              <Text style={styles.diaryStatus}>状态: {diary.status}</Text>
              
              {diary.inviterContent && (
                <View style={styles.contentSection}>
                  <Text style={styles.contentLabel}>邀请者内容:</Text>
                  <Text style={styles.diaryContent}>{diary.inviterContent}</Text>
                  {diary.inviterImages && diary.inviterImages.length > 0 && (
                    <Text style={styles.imageCount}>图片: {diary.inviterImages.length} 张</Text>
                  )}
                </View>
              )}
              
              {diary.collaboratorContent && (
                <View style={styles.contentSection}>
                  <Text style={styles.contentLabel}>协作者内容:</Text>
                  <Text style={styles.diaryContent}>{diary.collaboratorContent}</Text>
                  {diary.collaboratorImages && diary.collaboratorImages.length > 0 && (
                    <Text style={styles.imageCount}>图片: {diary.collaboratorImages.length} 张</Text>
                  )}
                </View>
              )}
              
              <Text style={styles.diaryInfo}>
                更新时间: {formatDate(diary.updatedAt)}
              </Text>
            </View>
          ))
        )}

        {/* 简单协作日记部分 */}
        <Text style={styles.sectionTitle}>简单协作日记 (simple_collaboration_diaries)</Text>
        {diaries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>暂无简单协作日记</Text>
          </View>
        ) : (
          diaries.map((diary) => (
            <View key={diary.id} style={styles.diaryCard}>
              <Text style={styles.diaryTitle}>{diary.title}</Text>
              <Text style={styles.diaryContent}>{diary.content}</Text>
              <Text style={styles.diaryInfo}>
                作者: {diary.authorNickname} · {formatDate(diary.createdAt)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  diaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  diaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  diaryContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  diaryInfo: {
    fontSize: 12,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  diaryStatus: {
    fontSize: 12,
    color: '#ff6b9d',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contentSection: {
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b9d',
  },
  contentLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  imageCount: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});
