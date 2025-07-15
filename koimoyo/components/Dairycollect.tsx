import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder, TouchableOpacity,
  ImageBackground, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DiaryCard {
  id: number;
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
const MAX_VISIBLE_CARDS = 3;

const StackedCards: React.FC<StackedCardsProps> = ({ frameWidth }) => {
  const [cards, setCards] = useState<DiaryCard[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem('diary_cards');
        const savedFavorites = await AsyncStorage.getItem('favorite_ids');
        
        if (saved && savedFavorites) {
          const allCards: DiaryCard[] = JSON.parse(saved);
          const favoriteIds: number[] = JSON.parse(savedFavorites);
          
          // お気に入りの日記のみをフィルタリング
          const favoriteCards = allCards.filter(card => favoriteIds.includes(card.id));
          setCards(favoriteCards);
          setFavorites(favoriteIds);
        }
      } catch (e) {
        console.error('日記読み込み失敗:', e);
      }
    };
    loadData();
  }, []);

  const CARD_WIDTH = frameWidth * (212 / 400);
  const OFFSET_X = frameWidth * OFFSET_X_RATIO;

  // スワイプジェスチャーの設定
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (_, gestureState) => {
      const threshold = 100;
      
      if (gestureState.dx > threshold) {
        // 右スワイプ：前のカードに戻る（ループ対応）
        setCurrentIndex(currentIndex === 0 ? cards.length - 1 : currentIndex - 1);
      } else if (gestureState.dx < -threshold) {
        // 左スワイプ：次のカードに進む（ループ対応）
        setCurrentIndex((currentIndex + 1) % cards.length);
      }
      
      // アニメーションをリセット
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
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
    const visibleCards = [];
    for (let i = 0; i < Math.min(MAX_VISIBLE_CARDS, cards.length); i++) {
      const cardIndex = (currentIndex + i) % cards.length;
      visibleCards.push({ ...cards[cardIndex], stackIndex: i });
    }
    return visibleCards;
  };

  // スクロール時のインデックス更新は不要になったので削除

  return (
    <View style={{ alignItems: 'flex-end' }}>
      <View style={{ width: frameWidth, height: 179 }}>
        {getVisibleCards().map((card, index) => {
          const isTopCard = index === 0;
          const animatedStyle = isTopCard
            ? {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { translateX: index * OFFSET_X },
                ],
                zIndex: MAX_VISIBLE_CARDS - index,
              }
            : {
                transform: [{ translateX: index * OFFSET_X }],
                zIndex: MAX_VISIBLE_CARDS - index,
              };

          return (
            <Animated.View
              key={`${card.id}-${currentIndex}`}
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
                onPress={() => router.push(`/DiaryDetail?id=${card.id}`)}
                activeOpacity={0.9}
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
