import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width: screenWidth } = Dimensions.get('window');

interface CollaborationDiary {
  id: string;
  title: string;
  location?: string;
  inviterContent: string;
  inviterImages: string[];
  collaboratorContent: string;
  collaboratorImages: string[];
  inviterId: string;
  collaboratorId: string;
  createdAt: any;
}

interface UserProfile {
  nickname: string;
  gender: 'male' | 'female';
}

export default function CollaborationDiaryView() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [diary, setDiary] = useState<CollaborationDiary | null>(null);
  const [inviterProfile, setInviterProfile] = useState<UserProfile | null>(null);
  const [collaboratorProfile, setCollaboratorProfile] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const translateX = new Animated.Value(0);

  useEffect(() => {
    loadDiary();
  }, []);

  const loadDiary = async () => {
    try {
      const docRef = doc(db, 'final_collaboration_diaries', id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const diaryData = { id: docSnap.id, ...docSnap.data() } as CollaborationDiary;
        setDiary(diaryData);
        
        // 加载用户资料
        await loadUserProfiles(diaryData.inviterId, diaryData.collaboratorId);
      }
    } catch (error) {
      console.error('加载协作日记错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfiles = async (inviterId: string, collaboratorId: string) => {
    try {
      const [inviterDoc, collaboratorDoc] = await Promise.all([
        getDoc(doc(db, 'users', inviterId)),
        getDoc(doc(db, 'users', collaboratorId))
      ]);

      if (inviterDoc.exists()) {
        setInviterProfile(inviterDoc.data() as UserProfile);
      }
      if (collaboratorDoc.exists()) {
        setCollaboratorProfile(collaboratorDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('加载用户资料错误:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    const nextPage = direction === 'left' ? 1 : 0;
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
      Animated.timing(translateX, {
        toValue: -nextPage * screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const renderPage = (
    content: string,
    images: string[],
    profile: UserProfile | null,
    isInviter: boolean
  ) => {
    const backgroundColor = profile?.gender === 'female' 
      ? '#fce4ec' // 粉色背景
      : '#e3f2fd'; // 浅蓝色背景
    
    const accentColor = profile?.gender === 'female' 
      ? '#ff6b9d' 
      : '#42a5f5';

    return (
      <View style={[styles.page, { backgroundColor }]}>
        <View style={styles.pageContent}>
          {/* 用户标识 */}
          <View style={[styles.userTag, { backgroundColor: accentColor }]}>
            <Ionicons 
              name={profile?.gender === 'female' ? 'heart' : 'male'} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.userTagText}>
              {profile?.nickname || (isInviter ? '邀请者' : '协作者')}
            </Text>
          </View>

          {/* 图片列表 */}
          {images.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.imageScroll}
            >
              {images.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.collaborationImage} />
              ))}
            </ScrollView>
          )}

          {/* 内容 */}
          <ScrollView style={styles.contentScroll}>
            <Text style={styles.collaborationContent}>{content}</Text>
          </ScrollView>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!diary) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>日记未找到</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{diary.title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 日期和标题 */}
      <View style={styles.titleSection}>
        <Text style={styles.date}>{formatDate(diary.createdAt)}</Text>
        <Text style={styles.title}>{diary.title}</Text>
        {diary.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.location}>{diary.location}</Text>
          </View>
        )}
      </View>

      {/* 页面指示器 */}
      <View style={styles.pageIndicator}>
        <TouchableOpacity
          style={[styles.indicator, currentPage === 0 && styles.activeIndicator]}
          onPress={() => handleSwipe('right')}
        >
          <View style={[styles.indicatorDot, { backgroundColor: '#ff6b9d' }]} />
          <Text style={styles.indicatorText}>
            {inviterProfile?.nickname || '邀请者'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.indicator, currentPage === 1 && styles.activeIndicator]}
          onPress={() => handleSwipe('left')}
        >
          <View style={[styles.indicatorDot, { backgroundColor: '#42a5f5' }]} />
          <Text style={styles.indicatorText}>
            {collaboratorProfile?.nickname || '协作者'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 滑动页面容器 */}
      <Animated.View 
        style={[
          styles.pagesContainer,
          { transform: [{ translateX }] }
        ]}
      >
        {/* 邀请者页面 */}
        {renderPage(
          diary.inviterContent,
          diary.inviterImages,
          inviterProfile,
          true
        )}
        
        {/* 协作者页面 */}
        {renderPage(
          diary.collaboratorContent,
          diary.collaboratorImages,
          collaboratorProfile,
          false
        )}
      </Animated.View>

      {/* 滑动提示 */}
      <View style={styles.swipeHint}>
        <Ionicons name="chevron-back" size={20} color="#ccc" />
        <Text style={styles.swipeHintText}>左右滑动查看</Text>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f44',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  titleSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  date: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeIndicator: {
    backgroundColor: '#e8f5e8',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  indicatorText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  pagesContainer: {
    flex: 1,
    flexDirection: 'row',
    width: screenWidth * 2,
  },
  page: {
    width: screenWidth,
    flex: 1,
  },
  pageContent: {
    flex: 1,
    padding: 16,
  },
  userTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 16,
  },
  userTagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  imageScroll: {
    marginBottom: 16,
  },
  collaborationImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
    resizeMode: 'cover',
  },
  contentScroll: {
    flex: 1,
  },
  collaborationContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  swipeHintText: {
    fontSize: 12,
    color: '#ccc',
    marginHorizontal: 8,
  },
});
