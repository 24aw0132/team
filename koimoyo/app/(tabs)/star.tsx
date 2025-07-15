import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

interface DiaryCard {
  id: number;
  title: string;
  location: string;
  date: string;
  backgroundImage: string;
  content: string;
}

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
  const router = useRouter();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cardsData, setCardsData] = useState<DiaryCard[]>([]);

  // AsyncStorageからお気に入りと日記データを読み込み
  const loadData = async () => {
    try {
      const savedCards = await AsyncStorage.getItem('diary_cards');
      const savedFavorites = await AsyncStorage.getItem('favorite_ids');
      setCardsData(savedCards ? JSON.parse(savedCards) : []);
      setFavorites(savedFavorites ? JSON.parse(savedFavorites) : []);
    } catch (e) {
      console.error('AsyncStorage読み込みエラー:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // お気に入り追加・削除 & AsyncStorage保存
  const toggleFavorite = async (id: number) => {
    let updated: number[];
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    try {
      await AsyncStorage.setItem('favorite_ids', JSON.stringify(updated));
    } catch (e) {
      console.error('お気に入り保存エラー:', e);
    }
  };

  // 月ごとにグルーピング
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
                    onPress={() => router.push(`/DiaryDetail?id=${entry.id}`)}
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

function DiaryCardView({
  entry,
  favorites,
  toggleFavorite,
  onPress,
}: {
  entry: DiaryCard;
  favorites: number[];
  toggleFavorite: (id: number) => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.diaryCard} onPress={onPress} activeOpacity={0.8}>
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
            onPress={(e) => {
              e.stopPropagation(); // タップイベントのバブリング防止
              toggleFavorite(entry.id);
            }}
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
    </TouchableOpacity>
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
