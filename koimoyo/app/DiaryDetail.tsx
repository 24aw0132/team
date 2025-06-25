import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons'; // ← ここでアイコン読み込み

// ルートパラメータの型定義
type RootStackParamList = {
  DiaryDetail: {
    title: string;
    location: string;
    date: string;
    content: string;
    backgroundImage: string;
  };
};

type DiaryDetailRouteProp = RouteProp<RootStackParamList, 'DiaryDetail'>;

export default function DiaryDetail() {
  const route = useRoute<DiaryDetailRouteProp>();
  const navigation = useNavigation();
  const { title, location, date, content, backgroundImage } = route.params;

  // 画面タイトルを日付に設定
  useEffect(() => {
    navigation.setOptions({ title: date });
  }, [date, navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: backgroundImage }} style={styles.image} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.locationContainer}>
        <MaterialIcons name="location-pin" size={20} color="#FF4D6D" style={styles.locationIcon} />
        <Text style={styles.location}>{location}</Text>
      </View>
      <Text style={styles.content}>{content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FEF9FB',
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
});
