import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder, TouchableOpacity,
  ImageBackground, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface DiaryCard {
  id: number;
  firebaseId?: string; // Firebase document IDを保持
  title: string;
  location: string;
  date: string;
  backgroundImage: string;
  content: string;
}

interface StackedCardsProps {
  frameWidth: number;
}

const OFFSET_X_RATIO = 46 / 400;
const MAX_VISIBLE_CARDS = 6;

const StackedCards: React.FC<StackedCardsProps> = ({ frameWidth }) => {
  const [cards, setCards] = useState<DiaryCard[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardOrder, setCardOrder] = useState<number[]>([]); // 卡片显示顺序
  const pan = useRef(new Animated.ValueXY()).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  // FirebaseとAsyncStorageからお気に入りデータを読み込み
  const loadFavoritesFromFirebase = async () => {
    try {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) {
        return [];
      }

      // Firebaseからお気に入りデータを読み込み
      const favoritesQuery = query(
        collection(db, 'user_favorites'),
        where('userId', '==', currentUid)
      );
      
      const snapshot = await getDocs(favoritesQuery);
      const firebaseFavorites = snapshot.docs.map(doc => {
        const data = doc.data();
        // 権限の検証：ユーザーがこれらのお気に入り日記にアクセス権限を持つことを確認
        return data.diaryId;
      });
      
      // AsyncStorageからローカルお気に入りデータもバックアップとして読み込み
      const localFav = await AsyncStorage.getItem('favorite_ids');
      const localFavorites = localFav ? JSON.parse(localFav) : [];
      
      // Firebaseとローカルのお気に入りデータをマージし、重複を除去
      const combinedFavorites = [...new Set([...firebaseFavorites, ...localFavorites])];
      
      // 各お気に入りアイテムのアクセス権限を検証
      const validatedFavorites = [];
      for (const favoriteId of combinedFavorites) {
        try {
          // ユーザーがこの日記にアクセス権限を持つかを確認
          const diaryRef = doc(db, 'shared_diaries', favoriteId);
          const diarySnap = await getDoc(diaryRef);
          
          if (diarySnap.exists()) {
            const diaryData = diarySnap.data();
            const hasAccess = diaryData.authorId === currentUid || diaryData.partnerUid === currentUid;
            
            if (hasAccess) {
              validatedFavorites.push(favoriteId);
            } else {
              console.warn(`Removing unauthorized favorite: ${favoriteId}`);
            }
          } else {
            console.warn(`Diary not found, removing from favorites: ${favoriteId}`);
          }
        } catch (error) {
          console.warn(`Error validating favorite ${favoriteId}:`, error);
          // 検証に失敗した場合は、安全のためお気に入りから削除
        }
      }
      
      // 検証済みデータをAsyncStorageに保存
      await AsyncStorage.setItem('favorite_ids', JSON.stringify(validatedFavorites));
      
      return validatedFavorites;
      
    } catch (e) {
      console.error('Failed to load favorites from Firebase:', e);
      // Firebase読み込みに失敗した場合、AsyncStorageから読み込みを試行
      try {
        const fav = await AsyncStorage.getItem('favorite_ids');
        return fav ? JSON.parse(fav) : [];
      } catch (localError) {
        console.error('Failed to load local favorites:', localError);
        return [];
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem('diary_cards');
        const favoriteIds = await loadFavoritesFromFirebase(); // Firebaseデータを使用
        
        if (saved && favoriteIds.length > 0) {
          const allCards: DiaryCard[] = JSON.parse(saved);
          
          // お気に入りの日記のみをフィルタリング（firebaseIdまたはIDを文字列として比較）
          const favoriteCards = allCards.filter(card => {
            const cardId = card.firebaseId || card.id.toString();
            return favoriteIds.includes(cardId);
          });
          
          setCards(favoriteCards);
          setFavorites(favoriteIds); // 文字列配列として保持
          // カードの表示順序を初期化
          setCardOrder(favoriteCards.map((_, index) => index));
        }
      } catch (e) {
        console.error('日記読み込み失敗:', e);
      }
    };
    loadData();
  }, []);

    // フォーカス時にデータを再読み込み
  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          const saved = await AsyncStorage.getItem('diary_cards');
          const favoriteIds = await loadFavoritesFromFirebase(); // Firebaseデータを使用
          
          if (saved && favoriteIds.length > 0) {
            const allCards: DiaryCard[] = JSON.parse(saved);
            
            const favoriteCards = allCards.filter(card => {
              const cardId = card.firebaseId || card.id.toString();
              return favoriteIds.includes(cardId);
            });
            
            setCards(favoriteCards);
            setFavorites(favoriteIds);
            // 重新初始化卡片显示顺序
            setCardOrder(favoriteCards.map((_, index) => index));
          }
        } catch (e) {
          console.error('日記読み込み失敗:', e);
        }
      };
      loadData();
    }, [])
  );

  const CARD_WIDTH = frameWidth * (212 / 400);
  const OFFSET_X = frameWidth * OFFSET_X_RATIO;

  // スワイプジェスチャーの設定
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isAnimating,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // 横向きのジェスチャーのみ反応し、縦方向は無視
      return !isAnimating && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (_, gestureState) => {
      if (isAnimating) return;
      
      const threshold = 30;
      const velocityThreshold = 0.2;
      
      if (gestureState.dx > threshold || gestureState.vx > velocityThreshold) {
        // 右スワイプ：当前卡片移到队列最后
        setIsAnimating(true);
        const newOrder = [...cardOrder];
        const currentCardIndex = newOrder.shift(); // 移除第一张卡片
        if (currentCardIndex !== undefined) {
          newOrder.push(currentCardIndex); // 添加到最后
        }
        setCardOrder(newOrder);
        
        Animated.timing(pan, {
          toValue: { x: 0, y: 0 },
          duration: 250,
          useNativeDriver: false,
        }).start(() => setIsAnimating(false));
        
      } else if (gestureState.dx < -threshold || gestureState.vx < -velocityThreshold) {
        // 左スワイプ：将最后一张卡片移到前面
        setIsAnimating(true);
        const newOrder = [...cardOrder];
        const lastCardIndex = newOrder.pop(); // 移除最后一张卡片
        if (lastCardIndex !== undefined) {
          newOrder.unshift(lastCardIndex); // 添加到最前面
        }
        setCardOrder(newOrder);
        
        Animated.timing(pan, {
          toValue: { x: 0, y: 0 },
          duration: 250,
          useNativeDriver: false,
        }).start(() => setIsAnimating(false));
        
      } else {
        // 元の位置に戻る
        Animated.timing(pan, {
          toValue: { x: 0, y: 0 },
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  // お気に入りの日記がない場合の表示
  if (cards.length === 0) {
    return (
      <View style={{ alignItems: 'flex-end' }}>
        <View style={[styles.emptyContainer, { width: frameWidth, height: 179 }]}>
          <Ionicons name="star-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>お気に入りの日記がありません</Text>
          <Text style={styles.emptySubText}>日記一覧でお気に入りを登録しよう！</Text>
        </View>
      </View>
    );
  }

  // 表示するカードの範囲を計算
  const getVisibleCards = () => {
    if (cardOrder.length === 0) return [];
    
    const visibleCards = [];
    for (let i = 0; i < Math.min(MAX_VISIBLE_CARDS, cardOrder.length); i++) {
      const originalCardIndex = cardOrder[i];
      if (cards[originalCardIndex]) {
        visibleCards.push({ 
          ...cards[originalCardIndex], 
          stackIndex: i,
          originalIndex: originalCardIndex 
        });
      }
    }
    return visibleCards;
  };

  return (
    <View style={{ alignItems: 'flex-end' }}>
      <View style={{ width: frameWidth, height: 179 }}>
        {getVisibleCards().map((card, index) => {
          const isTopCard = index === 0;
          
          // より自然なスタック効果
          const baseTranslateX = index * OFFSET_X;
          
          const animatedStyle = isTopCard
            ? {
                transform: [
                  { translateX: Animated.add(pan.x, baseTranslateX) },
                ],
                zIndex: MAX_VISIBLE_CARDS - index,
              }
            : {
                transform: [{ translateX: baseTranslateX }],
                zIndex: MAX_VISIBLE_CARDS - index,
              };

          return (
            <Animated.View
              key={`card-${card.originalIndex}-${currentIndex}`}
              style={[
                styles.stackCard,
                animatedStyle,
                {
                  width: CARD_WIDTH,
                  height: 179,
                },
              ]}
              {...(isTopCard ? panResponder.panHandlers : {})}
            >
              <TouchableOpacity
                style={styles.cardTouchable}
                onPress={() => {
                  // Firebase IDを使用してルーティング
                  const routeId = card.firebaseId || card.id.toString();
                  console.log('Navigating to diaryDetail with ID:', routeId);
                  router.push(`/diaryDetail?id=${routeId}&type=shared`);
                }}
                activeOpacity={0.7}
              >
                <ImageBackground
                  source={{ uri: card.backgroundImage }}
                  style={styles.backgroundImage}
                >
                  <View style={styles.overlay} />
                  <View style={styles.cardContent}>
                    <View style={styles.locationContainer}>
                      <Ionicons name="location-outline" size={16} color="#fff" />
                      <Text style={styles.location}>{card.location}</Text>
                    </View>
                    <Text style={styles.title}>{card.title}</Text>
                    <Text style={styles.date}>{card.date}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
  },
  stackCard: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  swipeCard: {
    height: 179,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#eee',
  },
  emptyContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default StackedCards;
