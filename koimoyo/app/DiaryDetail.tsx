import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { getCollaborationDiary } from '../utils/collaborationDiary';

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

export default function DiaryDetail() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams();
  const [sharedDiary, setSharedDiary] = useState<SharedDiary | null>(null);
  const [collaborationDiary, setCollaborationDiary] = useState<CollaborationDiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  // 滑动相关状态
  const [currentPage, setCurrentPage] = useState(0); // 0: 创作者页面, 1: 协作者页面/邀请页面
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(0)).current;
  const [partnerNickname, setPartnerNickname] = useState<string>('');
  
  // 圆形加号动画
  const circleScale = useRef(new Animated.Value(0)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (type === 'shared') {
      loadSharedDiary();
    } else if (type === 'collaboration') {
      loadCollaborationDiaryPage();
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

  // 获取伙伴昵称
  const loadPartnerNickname = async (partnerUid: string) => {
    try {
      if (partnerUid) {
        const partnerDoc = await getDoc(doc(db, 'users', partnerUid));
        if (partnerDoc.exists()) {
          const partnerData = partnerDoc.data();
          setPartnerNickname(partnerData.nickname || 'パートナー');
        }
      }
    } catch (error) {
      console.error('パートナーのニックネーム取得に失敗:', error);
      setPartnerNickname('パートナー');
    }
  };

  const loadCollaborationDiaryPage = async () => {
    try {
      // 如果是协作日记，直接导航到协作日记视图页面
      router.push({
        pathname: '/collaboration-diary-view',
        params: { id }
      } as any);
    } catch (error) {
      console.error('協同日記の読み込みエラー:', error);
      Alert.alert('エラー', '協同日記の読み込みに失敗しました');
    }
  };

  // 加载协作日记内容
  const loadCollaborationDiary = async (originalDiaryId: string) => {
    try {
      console.log('查找协作日记，原始日记ID:', originalDiaryId);
      
      // 方法1: 直接查询以原始日记ID开头的协作日记ID
      const collaborationQuery1 = query(
        collection(db, 'collaboration_diaries'),
        orderBy('updatedAt', 'desc')
      );

      // 实时监听协作日记变化
      const unsubscribe = onSnapshot(collaborationQuery1, (snapshot) => {
        let foundCollab = null;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // 检查是否是与当前日记相关的协作日记
          if (doc.id.includes(originalDiaryId) || data.originalDiaryId === originalDiaryId) {
            foundCollab = { id: doc.id, ...data } as CollaborationDiary;
            return; // 找到就停止
          }
        });

        if (foundCollab) {
          console.log('找到协作日记:', foundCollab);
          setCollaborationDiary(foundCollab);
        } else {
          console.log('没有找到协作日记');
          setCollaborationDiary(null);
        }
      }, (error) => {
        console.error('協同日記の監視に失敗:', error);
      });

      // 注意：这里暂时不返回 unsubscribe，实际应用中应该在组件卸载时调用
    } catch (error) {
      console.error('協同日記の読み込みに失敗:', error);
    }
  };

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
          // 获取伙伴昵称
          await loadPartnerNickname(diaryData.partnerUid);
          // 检查是否有协作日记
          await loadCollaborationDiary(diaryData.id);
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

  // 滑动手势处理
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // 只响应明显的水平滑动
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 30;
      },
      onPanResponderGrant: () => {
        // 开始滑动时设置当前位置
        translateX.setOffset(-currentPage * screenWidth);
        translateX.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // 实时跟随手势
        translateX.setValue(gestureState.dx);
        
        // 当向左滑动时，显示圆形加号动画
        if (gestureState.dx < -50 && currentPage === 0) {
          const progress = Math.min(Math.abs(gestureState.dx) / (screenWidth * 0.3), 1);
          circleScale.setValue(progress);
          circleOpacity.setValue(progress);
        } else if (currentPage === 0) {
          circleScale.setValue(0);
          circleOpacity.setValue(0);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();
        
        const threshold = screenWidth * 0.25; // 降低阈值，使滑动更敏感
        let targetPage = currentPage;
        
        if (gestureState.dx < -threshold && currentPage === 0) {
          // 向左滑动，从第一页到第二页
          targetPage = 1;
        } else if (gestureState.dx > threshold && currentPage === 1) {
          // 向右滑动，从第二页到第一页
          targetPage = 0;
        }
        
        animateToPage(targetPage);
      },
    })
  ).current;

  const animateToPage = (pageIndex: number) => {
    setCurrentPage(pageIndex);
    Animated.timing(translateX, {
      toValue: -pageIndex * screenWidth,
      duration: 250,
      useNativeDriver: true,
    }).start();
    
    // 如果切换到第二页且是邀请页面，显示圆形加号
    if (pageIndex === 1 && !collaborationDiary?.collaboratorContent) {
      Animated.parallel([
        Animated.spring(circleScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(circleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 隐藏圆形加号
      Animated.parallel([
        Animated.timing(circleScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(circleOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
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

  const handleInvitePartner = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !sharedDiary) return;

      // 生成唯一的协作日记ID
      const collaborationDiaryId = `collab_${sharedDiary.id}_${Date.now()}`;

      console.log('招待送信情報:', {
        originalDiaryId: sharedDiary.id,
        collaborationDiaryId: collaborationDiaryId,
        diaryTitle: sharedDiary.title,
        inviterId: currentUser.uid,
        inviterNickname: sharedDiary.authorNickname,
        inviteeId: sharedDiary.partnerUid,
      });

      // 检查 partnerUid 是否存在
      if (!sharedDiary.partnerUid) {
        Alert.alert('エラー', 'パートナー情報が見つかりません。まずパートナーとペアリングしてください');
        return;
      }

      // 创建协作邀请记录
      const inviteRef = await addDoc(collection(db, 'collaboration_invites'), {
        originalDiaryId: sharedDiary.id, // 原始日记ID
        diaryId: collaborationDiaryId, // 协作日记ID
        diaryTitle: sharedDiary.title,
        inviterId: currentUser.uid,
        inviterNickname: sharedDiary.authorNickname,
        inviteeId: sharedDiary.partnerUid,
        status: 'pending', // pending, accepted, declined
        createdAt: serverTimestamp(),
        type: 'diary_collaboration'
      });

      console.log('招待作成成功、ID:', inviteRef.id);

      Alert.alert(
        '招待を送信しました',
        'パートナーに協同編集の招待を送信しました！',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('招待送信エラー:', error);
      Alert.alert('エラー', '招待の送信に失敗しました。もう一度お試しください');
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
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View 
        style={[
          styles.pagesContainer,
          {
            transform: [{ translateX }],
            width: screenWidth * 2, // 确保容器宽度是两倍屏幕宽度
          }
        ]}
      >
        {/* 第一页：创作者日记 - 全屏独立页面 */}
        <View style={[styles.singlePage, { width: screenWidth }]}>
          <ScrollView style={styles.fullScreenScroll} contentContainerStyle={styles.fullScreenScrollContent}>
            <View style={styles.fullScreenCard}>
              {/* 顶部按钮 */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/star')}>
                  <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Ionicons name="share-social-outline" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              {/* 创作者标识 */}
              <View style={[styles.sharedHeader, styles.creatorHeader]}>
                <Ionicons name="heart" size={20} color="#ff6b9d" />
                <Text style={styles.sharedLabel}>作成者</Text>
              </View>

              {/* 日期、标题、作者 */}
              <Text style={styles.date}>{formatDate(sharedDiary.createdAt)}</Text>
              <Text style={styles.title}>{sharedDiary.title}</Text>

              <View style={styles.authorRow}>
                <MaterialIcons name="person" size={20} color="#FF4D6D" />
                <Text style={styles.author}>作者: {sharedDiary.authorNickname}</Text>
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
        </View>

        {/* 第二页：协作者日记或邀请页面 - 全屏独立页面 */}
        <View style={[styles.singlePage, { width: screenWidth }]}>
          {collaborationDiary?.collaboratorContent ? (
            // 协作者内容页面 - 全屏
            <ScrollView style={styles.fullScreenScroll} contentContainerStyle={styles.fullScreenScrollContent}>
              <View style={styles.fullScreenCard}>
                {/* 顶部按钮 */}
                <View style={styles.header}>
                  <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/star')}>
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Ionicons name="share-social-outline" size={22} color="#333" />
                  </TouchableOpacity>
                </View>

                {/* 协作者标识 */}
                <View style={[styles.sharedHeader, styles.collaboratorHeader]}>
                  <Ionicons name="heart" size={20} color="#4a90e2" />
                  <Text style={[styles.sharedLabel, { color: '#4a90e2' }]}>協力者</Text>
                </View>

                {/* 日期和标题 */}
                <Text style={styles.date}>{formatDate(collaborationDiary.updatedAt)}</Text>
                <Text style={styles.title}>{sharedDiary.title}</Text>

                <View style={styles.authorRow}>
                  <MaterialIcons name="person" size={20} color="#4a90e2" />
                  <Text style={styles.author}>協力者: {partnerNickname}</Text>
                </View>

                {/* 协作者图片 */}
                {collaborationDiary.collaboratorImages && collaborationDiary.collaboratorImages.length > 0 && (
                  <View style={styles.imageList}>
                    {collaborationDiary.collaboratorImages.map((uri, index) => (
                      <Image key={`collaborator-${index}`} source={{ uri }} style={styles.verticalImage} />
                    ))}
                  </View>
                )}

                {/* 协作者内容 */}
                <Text style={styles.content}>{collaborationDiary.collaboratorContent}</Text>
              </View>
            </ScrollView>
          ) : (
            // 邀请页面 - 全屏背景，隐藏的圆形加号
            <View style={styles.invitePageFullscreen}>
              {/* 动画圆形加号 */}
              <Animated.View 
                style={[
                  styles.animatedInviteCircle,
                  {
                    transform: [{ scale: circleScale }],
                    opacity: circleOpacity,
                  }
                ]}
              >
                <TouchableOpacity 
                  style={styles.animatedInvitePlusButton}
                  onPress={handleInvitePartner}
                >
                  <Ionicons name="add" size={40} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pagesContainer: {
    flexDirection: 'row',
    height: '100%', // 确保容器占满整个高度
  },
  page: {
    flex: 1,
  },
  // 单独页面样式 - 每个页面都是独立的全屏页面
  singlePage: {
    flex: 1,
    height: '100%',
  },
  // 全屏日记样式
  fullScreenScroll: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullScreenScrollContent: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  fullScreenCard: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingVertical: 20,
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
  inviteButton: {
    backgroundColor: '#ff6b9d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#ff6b9d',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  inviteButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // 新增的协作样式
  originalContentSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b9d',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  collaborationSection: {
    marginTop: 20,
  },
  collaborationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  contentCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inviterCard: {
    backgroundColor: '#fff0f5', // 粉色主题
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b9d',
  },
  collaboratorCard: {
    backgroundColor: '#f0f8ff', // 蓝色主题
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  inviterBadge: {
    backgroundColor: '#ff6b9d',
  },
  collaboratorBadge: {
    backgroundColor: '#4a90e2',
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  collaborationContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  collaborationStatus: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  // 新增的滑动相关样式
  creatorHeader: {
    backgroundColor: '#fff0f5',
    borderColor: '#ff6b9d',
  },
  collaboratorHeader: {
    backgroundColor: '#f0f8ff',
    borderColor: '#4a90e2',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    gap: 8,
  },
  swipeHintText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  // 新的全屏邀请页面样式
  invitePageFullscreen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 动画圆形加号样式
  animatedInviteCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff6b9d',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ff6b9d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  animatedInvitePlusButton: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ff6b9d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#ff6b9d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  invitePlusButton: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
