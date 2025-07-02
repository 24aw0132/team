import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface DiaryCard {
  id: number;
  title: string;
  location: string;
  date: string;
  backgroundImage: string;
  content: string;
}

// 日記データ
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

function DashedLine({ height = 100, dashHeight = 6, gap = 4, color = '#ccc' }) {
  const dashes = [];
  const count = Math.floor(height / (dashHeight + gap));
  for (let i = 0; i < count; i++) {
    dashes.push(
      <View
        key={i}
        style={{
          width: 2,
          height: dashHeight,
          backgroundColor: color,
          marginBottom: gap,
        }}
      />
    );
  }

  return <View style={{ width: 2, alignItems: 'center' }}>{dashes}</View>;
}

export default function Star() {
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const groupedEntries = cardsData.reduce((acc, entry) => {
    const month = entry.date.split('/')[1];
    const key = `${parseInt(month)}月`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {} as Record<string, DiaryCard[]>);

  const months = Object.keys(groupedEntries).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>日記一覧</Text>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {months.map(month => (
          <View key={month} style={styles.monthSection}>

            <View style={styles.timelineRow}>
              <View style={styles.monthLabel}>
                <Text style={styles.monthText}>{month}</Text>
              </View>
            </View>
            {groupedEntries[month].map(entry => (
              <View key={entry.id} style={styles.timelineRow}>
                <DashedLine height={220} />
                <View style={styles.cardWrapper}>
                  <DiaryCardView
                    entry={entry}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

//日記カード
function DiaryCardView({
  entry,
  favorites,
  toggleFavorite,
}: {
  entry: DiaryCard;
  favorites: number[];
  toggleFavorite: (id: number) => void;
}) {
  return (
    <View style={styles.diaryCard}>
      <ImageBackground
        source={{ uri: entry.backgroundImage }}
        style={styles.cardImage}
        resizeMode="cover"
      >
        <View style={styles.cardOverlay} />
        <View style={styles.cardTopRow}>
          <View style={styles.locationTag}>
            <Ionicons name="location-outline" size={14} color="white" />
            <Text style={styles.locationText}>{entry.location}</Text>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(entry.id)}
          >
            <Ionicons
              name={favorites.includes(entry.id) ? 'star' : 'star-outline'}
              size={18}
              color="#FFD700"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardTitle}>{entry.title}</Text>
          <Text style={styles.cardDate}>{entry.date}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6F4' },
  monthSection: { marginBottom: 30 },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A47D7D',
    textAlign: 'center',
    height: 40,
    marginTop: 20,
    marginBottom: 10,
  },
  monthLabel: {
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 8,
  marginVertical: 4,
  marginLeft: -15,
  },
  monthText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  cardWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  diaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  cardImage: {
    height: 200,
    justifyContent: 'space-between',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  locationText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  favoriteButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 14,
    color: 'white',
  },
});