// favoriteStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiaryCard } from '../app/(tabs)/diaryData';

const FAVORITE_KEY = 'FAVORITE_DIARIES';

export const saveFavoriteDiaries = async (favorites: DiaryCard[]) => {
  try {
    await AsyncStorage.setItem(FAVORITE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('保存に失敗:', error);
  }
};

export const loadFavoriteDiaries = async (): Promise<DiaryCard[]> => {
  try {
    const data = await AsyncStorage.getItem(FAVORITE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('読み込みに失敗:', error);
    return [];
  }
};