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
    title: 'カフェ巡りしてきた☕️',
    location: '渋谷',
    date: '2025/06/16',
    backgroundImage: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800',
    content: '今日は彼と渋谷でのんびりカフェ巡りしてきたよ〜。最初に入ったのは小さくてかわいい隠れ家みたいなカフェ。彼はコーヒー、私は甘いラテを頼んで、ゆったりおしゃべりしながらほっと一息。次のカフェはおしゃれなパンケーキが有名なところで、二人でシェアしながらわいわい。ふわふわのパンケーキにメープルたっぷりかけて、幸せすぎて顔がにやけちゃった（笑）。渋谷っていつも人が多いけど、カフェの中は意外と静かで落ち着ける空間が多くてびっくり。最後はテラス席が気持ちいいお店でアイスクリーム食べながら、ぼーっと通りを眺めてのんびりタイム。彼と一緒にいると時間がゆっくり流れる感じがして、なんだかほっこり。渋谷のカフェ巡り、またやりたいな〜って思った一日でした。'
  },
  {
    id: 2,
    title: '雨だったから美術館☔️',
    location: '上野',
    date: '2025/06/15',
    backgroundImage: 'https://images.unsplash.com/photo-1553532434-5ab5b6b84993?w=800',
    content: '今日は朝から雨ぽつぽつで、予定してた公園おさんぽは中止。でもそのかわりに、急きょ上野で美術館デートしてきた☔️。上野って、雨でも楽しめる場所いっぱいあるからありがたい〜。最初に入った美術館では、ちょっと難しい絵とかもあってふたりで「これ何に見える？」とか言いながら、想像ふくらませて勝手にストーリー作ったりしてた（笑）。静かな空間で並んで歩くのも、なんかいいよね〜ってしみじみ。途中でカフェに入って、雨を見ながらのあったかカフェラテが最高だった☕️彼はレモンタルトに感動してた🍋帰り道は傘さしながらのんびり歩いて、ちょっと肌寒いけど、手をつなぐのが自然で嬉しかったりして。雨のデートも悪くないな〜って思えた一日でした。また美術館行きたいなぁ。'
  },
  {
    id: 3,
    title: '秋葉原でまさかの2人でメイドカフェ',
    location: '秋葉原',
    backgroundImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800',
    date: '2025/06/14',
    content: '今日はなんとなく秋葉原ぶらぶらしてたら、彼が「ちょっと行ってみない？」って言うから、まさかの…メイドカフェデビュー（笑）！最初はふたりともソワソワしてたけど、メイドさんたちがめちゃ明るくて優しくて、一気に空気ゆるゆるに。注文したオムライスに、メイドさんがケチャップでくま描いてくれて、「萌え萌えきゅん」って唱えながら食べたのが地味にクセになりそう😂彼のちょっと照れた顔、レアすぎてこっそりニヤニヤ。ドリンクもやたらかわいくて、ふたりで写真撮りまくってた📸カップルで行くのどうかな〜と思ったけど、意外と楽しくてアリかも！帰りはゲーセン寄って、ぬいぐるみ取れなかったけど、なんか思い出に残る秋葉原デートになったな〜。また何かのノリで行っちゃうかもね（笑）'
  },
  {
    id: 4,
    title: '東京タワーの夜景',
    location: '東京タワー',
    date: '2025/06/13',
    backgroundImage: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800',
    content: '今日は仕事終わりに待ち合わせして、夜の東京タワー見に行ってきた〜！ちょっと肌寒かったけど、そのぶん空気が澄んでて、ライトアップされたタワーがめちゃくちゃきれいだった。見上げた瞬間「わあ〜」って声そろっちゃって、ちょっと笑った（笑）。展望台にも登って、東京の夜景をぐる〜っと見渡せて、まるで宝石散りばめたみたいな光の海にうっとり。彼が「すごいね」ってつぶやいた声がなんかやさしくて、心まであったかくなった。写真もいっぱい撮ったけど、カメラじゃ伝えきれないきらきら感だったなぁ。帰りに近くのカフェでホットチョコ飲んで、ほっとひと息。夜景の余韻でちょっとふたりとも静かになっちゃったけど、それもなんか特別な時間って感じで好きだった。東京タワー、やっぱりすごいな〜。今度は昼間も来てみたいな🗼'
  },
  {
    id: 5,
    title: '銀座の静かな通りをちょっと歩いた',
    location: '銀座',
    date: '2025/06/12',
    backgroundImage: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?w=800',
    content: '今日はなんとなく、ふたりで銀座をふらっとおさんぽ。にぎやかな通りから少し外れた静かなエリアを、ゆっくり歩くだけだったんだけど、それがすごく心地よかった。夜の銀座って、ネオンがきらきらしてるのに落ち着いた雰囲気があって、大人な感じ。ショーウィンドウを見ながら「これ似合いそう〜」とか言って軽く妄想デート（笑）。歩道のタイルの音とか、ふたりの足音だけが響いて、なんだか映画のワンシーンみたいだった。途中で立ち寄った小さなカフェも静かで落ち着いてて、ふたりともなんとなく声のトーンまでちょっとやわらかくなった気がする。特別なことはしてないのに、なんか記憶に残る夜だったな。人混みに疲れたとき、こういう時間ってすごく大事。次は昼の銀座もいいかもね、って言いながら電車に揺られて帰った🍃'
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

