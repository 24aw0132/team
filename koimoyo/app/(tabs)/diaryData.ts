export interface DiaryCard {
  id: number;
  title: string;
  location: string;
  date: string; // 'YYYY/MM/DD'形式
  backgroundImage: string;
  content: string;
}

export const cardsData: DiaryCard[] = [
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
    content: '在美术馆度过了一个安静的下午...'
  },
  {
    id: 3,
    title: '秋叶原购物日记',
    location: '东京·秋叶原',
    backgroundImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800',
    date: '2025/06/14',
    content: '今天在秋叶原淘到了很多好东西'
  },
  {
    id: 4,
    title: '夜游东京塔',
    location: '东京·港区',
    date: '2025/06/13',
    backgroundImage: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800',
    content: '东京塔的夜景真是太美了'
  },
  {
    id: 5,
    title: '银座逛街',
    location: '东京·银座',
    date: '2025/06/12',
    backgroundImage: 'https://images.unsplash.com/photo-1542931287-023b922fa89b?w=800',
    content: '在银座度过了愉快的购物时光'
  }
];
