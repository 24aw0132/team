import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface SharedDiary {
  id: string;
  title: string;
  content: string;
  mood: string;
  weather: string;
  images: string[];
  authorId: string;
  authorNickname: string;
  partnerUid: string;
  createdAt: any;
  isShared: boolean;
}

export default function DiaryDetail() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams();
  const [sharedDiary, setSharedDiary] = useState<SharedDiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (type === 'shared') {
      loadSharedDiary();
    }
  }, [id, type]);

  // ユーザーアクセス権限の検証
  const verifyAccess = async (diaryData: SharedDiary): Promise<boolean> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('エラー', 'ログインが必要です');
        return false;
      }

      const currentUid = currentUser.uid;
      
      // ユーザーが日記の作成者かどうかを確認
      if (diaryData.authorId === currentUid) {
        return true;
      }

      // ユーザーが作成者のパートナーかどうかを確認
      if (diaryData.partnerUid === currentUid) {
        return true;
      }

      // どちらにも該当しない場合はアクセス権限なし
      Alert.alert('アクセス拒否', 'この日記にアクセスする権限がありません');
      return false;
      
    } catch (error) {
      console.error('Access verification error:', error);
      Alert.alert('エラー', 'アクセス権限の確認に失敗しました');
      return false;
    }
  };

  useEffect(() => {
    if (type === 'shared') {
      loadSharedDiary();
    }
  }, [id, type]);

  const loadSharedDiary = async () => {
    try {
      const docRef = doc(db, 'shared_diaries', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const diaryData = { ...data, id: docSnap.id } as SharedDiary;
        
        // アクセス権限の検証
        const accessGranted = await verifyAccess(diaryData);
        setHasAccess(accessGranted);
        
        if (accessGranted) {
          setSharedDiary(diaryData);
        } else {
          // 権限がない場合は前のページに戻る
          setTimeout(() => {
            router.back();
          }, 2000);
        }
      } else {
        Alert.alert('エラー', '日記が見つかりませんでした');
        setHasAccess(false);
      }
    } catch (error) {
      console.error('共有日記読み込みエラー:', error);
      Alert.alert('エラー', '日記の読み込みに失敗しました');
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `共有日記「${sharedDiary!.title}」\n${sharedDiary!.content}\n作成者: ${sharedDiary!.authorNickname}`,
      });
    } catch (error) {
      Alert.alert('エラー', '共有に失敗しました');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="lock-closed" size={50} color="#ff6b6b" />
          <Text style={styles.accessDeniedTitle}>アクセス拒否</Text>
          <Text style={styles.accessDeniedText}>
            この日記にアクセスする権限がありません
          </Text>
          <TouchableOpacity 
            style={styles.accessDeniedButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!sharedDiary) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>日記が見つかりませんでした</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        {/* 顶部按钮 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/star')}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        {/* 共有日記ラベル */}
        <View style={styles.sharedHeader}>
          <Ionicons name="heart" size={20} color="#ff6b9d" />
          <Text style={styles.sharedLabel}>共有日記</Text>
        </View>

        {/* 日期、标题、作者 */}
        <Text style={styles.date}>{formatDate(sharedDiary.createdAt)}</Text>
        <Text style={styles.title}>{sharedDiary.title}</Text>

        <View style={styles.authorRow}>
          <MaterialIcons name="person" size={20} color="#FF4D6D" />
          <Text style={styles.author}>作成者: {sharedDiary.authorNickname}</Text>
        </View>

        {/* 気分と天気 */}
        <View style={styles.moodWeatherRow}>
          <View style={styles.moodWeather}>
            <Text style={styles.emoji}>{sharedDiary.mood}</Text>
            <Text style={styles.emojiLabel}>気分</Text>
          </View>
          <View style={styles.moodWeather}>
            <Text style={styles.emoji}>{sharedDiary.weather}</Text>
            <Text style={styles.emojiLabel}>天気</Text>
          </View>
        </View>

        {/* 图片 */}
        {sharedDiary.images?.length > 0 && (
          <View style={styles.imageList}>
            {sharedDiary.images.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.verticalImage} />
            ))}
          </View>
        )}

        {/* 内容 */}
        <Text style={styles.content}>{sharedDiary.content}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    elevation: 3,
  },
  shareButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    elevation: 3,
  },
  sharedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff0f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sharedLabel: {
    fontSize: 14,
    color: '#ff6b9d',
    fontWeight: '600',
    marginLeft: 6,
  },
  date: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222', // 黑色
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  author: {
    fontSize: 15,
    color: '#666',
    marginLeft: 6,
  },
  moodWeatherRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  moodWeather: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  emojiLabel: {
    fontSize: 12,
    color: '#666',
  },
  imageList: {
    marginBottom: 20,
  },
  verticalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
    color: '#aaa',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
    color: '#f44',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 20,
    marginBottom: 10,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  accessDeniedButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#ff6b6b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
