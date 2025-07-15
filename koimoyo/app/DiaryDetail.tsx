import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DiaryCard {
  id: number;
  title: string;
  location: string;
  date: string;
  backgroundImage: string;
  content: string;
}

export default function DiaryDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [diary, setDiary] = useState<DiaryCard | null>(null);

  useEffect(() => {
    loadDiary();
  }, [id]);

  const loadDiary = async () => {
    try {
      const savedCards = await AsyncStorage.getItem('diary_cards');
      if (savedCards) {
        const cards: DiaryCard[] = JSON.parse(savedCards);
        const foundDiary = cards.find(card => card.id === parseInt(id as string));
        setDiary(foundDiary || null);
      }
    } catch (e) {
      console.error('日記読み込みエラー:', e);
    }
  };

  if (!diary) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.errorText}>日記が見つかりませんでした</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color="#333" />
      </TouchableOpacity>
      {diary.backgroundImage && (
        <Image source={{ uri: diary.backgroundImage }} style={styles.image}/>
      )}
      <Text style={styles.date}>{diary.date}</Text>
      <Text style={styles.title}>{diary.title}</Text>
      <View style={styles.locRow}>
        <MaterialIcons name="location-pin" size={20} color="#FF4D6D"/>
        <Text style={styles.location}>{diary.location}</Text>
      </View>
      <Text style={styles.content}>{diary.content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FEF9FB',
    paddingTop: 60,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    left: 20,
    zIndex: 100,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4D6D',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationIcon: {
    marginRight: 6,
  },
  location: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  locRow:{
    flexDirection:'row',
    alignItems:'center',
    marginBottom:8,
  },
  date:{
    fontSize:14,
    color:'#666',
    marginBottom:8,
  },
  errorText: {
    fontSize: 18,
    color: '#FF4D6D',
    textAlign: 'center',
    marginTop: 100,
  },
});
