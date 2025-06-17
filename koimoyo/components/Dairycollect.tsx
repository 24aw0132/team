import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  PanResponder, 
  TouchableOpacity, 
  ImageBackground,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 常量定义
const SIDE_MARGIN = 20;
const FRAME_HEIGHT = 179;
const CARD_HEIGHT = 179;
const CARD_ASPECT_RATIO = 212 / 179;
const OFFSET_X_RATIO = 46 / 400;
const MAX_CARDS = 5;

// 日记卡片数据接口
interface DiaryCard {
  id: number;
  title: string;
  location: string;
  date: string;
  backgroundImage: string;
  content: string;
}

// 示例数据 - 使用实际可访问的图片URL
const cardsData: DiaryCard[] = [
  {
    id: 1,
    title: '春日午后的咖啡馆',
    location: '东京·涉谷',
    date: '2025/06/16',
    backgroundImage: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800',
    content: '今天在涉谷发现了一家很棒的咖啡馆...'
  },
  {
    id: 2,
    title: '雨天的美术馆',
    location: '京都',
    date: '2025/06/15',
    backgroundImage: 'https://images.unsplash.com/photo-1553532434-5ab5b6b84993?w=800',
    content: '在美术馆度过了一个安静的下午...'
  },
  {
    id: 3,
    title: '秋叶原购物日记',
    location: '东京·秋叶原',
    backgroundImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800',
    date: '2025/06/14',
    content: '今天在秋叶原淘到了很多好东西...'
  },
  {
    id: 4,
    title: '夜游东京塔',
    location: '东京·港区',
    date: '2025/06/13',
    backgroundImage: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800',
    content: '东京塔的夜景真是太美了...'
  },
  {
    id: 5,
    title: '银座逛街',
    location: '东京·银座',
    date: '2025/06/12',
    backgroundImage: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?w=800',
    content: '在银座度过了愉快的购物时光...'
  }
];

interface StackedCardsProps {
  frameWidth: number;
}

const StackedCards: React.FC<StackedCardsProps> = ({ frameWidth }) => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [data, setData] = useState(cardsData);
  const pan = useRef(new Animated.ValueXY()).current;

  const CARD_WIDTH = frameWidth * (212 / 400);
  const OFFSET_X = frameWidth * OFFSET_X_RATIO;

  const toggleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > 120) {
        Animated.timing(pan, {
          toValue: { 
            x: gestureState.dx > 0 ? frameWidth : -frameWidth, 
            y: 0 
          },
          duration: 200,
          useNativeDriver: false
        }).start(() => {
          pan.setValue({ x: 0, y: 0 });
          const newData = [...data];
          const movedCard = newData.shift();
          if (movedCard) {
            newData.push(movedCard);
          }
          setData(newData);
        });
      } else {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5
        }).start();
      }
    }
  });

  return (
    <View style={[styles.container, { paddingHorizontal: SIDE_MARGIN }]}>
      <View style={[styles.frame, { width: frameWidth, height: FRAME_HEIGHT }]}>
        {data.slice(0, MAX_CARDS).reverse().map((card, index) => {
          const realIndex = MAX_CARDS - 1 - index;
          const translateX = realIndex * OFFSET_X;
          const isTopCard = realIndex === 0;
          const isFavorite = favorites.includes(card.id);

          const animatedStyle = isTopCard
            ? {
                transform: [...pan.getTranslateTransform()],
                zIndex: 100,
              }
            : {
                transform: [
                  { translateX }  // 只保留水平方向的偏移
                ],
                zIndex: MAX_CARDS - realIndex,
              };

          return (
            <Animated.View
              key={card.id}
              style={[
                styles.card,
                animatedStyle,
                { 
                  width: CARD_WIDTH, 
                  height: CARD_HEIGHT,
                  // 添加一些微妙的阴影来区分卡片
                  elevation: isTopCard ? 8 : MAX_CARDS - realIndex,
                }
              ]}
              {...(isTopCard ? panResponder.panHandlers : {})}
            >
              <ImageBackground
                source={{ uri: card.backgroundImage }}
                style={[
                  styles.backgroundImage,
                  !isTopCard && styles.nonActiveCard
                ]}
                resizeMode="cover"
                onError={(e) => {
                  console.log('Image loading error:', e.nativeEvent.error);
                }}
              >
                {isTopCard && (
                  <>
                    <View style={styles.overlay} />
                    <View style={styles.cardContent}>
                      <View style={styles.headerContainer}>
                        <View style={styles.locationContainer}>
                          <Ionicons name="location-outline" size={16} color="white" />
                          <Text style={styles.location}>{card.location}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => toggleFavorite(card.id)}
                          style={styles.favoriteContainer}
                          activeOpacity={0.7}
                        >
                          <View style={styles.circle}>
                            {isFavorite ? (
                              <Ionicons name="star" size={20} color="#FFD700" />
                            ) : (
                              <Ionicons name="star-outline" size={20} color="white" />
                            )}
                          </View>
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.footerContainer}>
                        <Text style={styles.title} numberOfLines={2}>
                          {card.title}
                        </Text>
                        <Text style={styles.date}>{card.date}</Text>
                      </View>
                    </View>
                  </>
                )}
              </ImageBackground>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    position: 'relative',
    height: FRAME_HEIGHT,
  },
  card: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    // 添加阴影效果
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  nonActiveCard: {
    opacity: 0.8,  // 调整非活动卡片的透明度
    backgroundColor: '#F5F5F5',  // 添加背景色
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  footerContainer: {
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  date: {
    fontSize: 14,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  favoriteContainer: {
    alignSelf: 'flex-start',
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StackedCards;

