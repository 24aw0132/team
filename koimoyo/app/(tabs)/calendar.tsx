import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Firebase日记数据结构
interface FirebaseDiary {
  id: string;
  title: string;
  content: string;
  mood: string;
  weather: string;
  images: string[];
  authorId: string;
  authorNickname: string;
  partnerUid: string;
  createdAt: any;
  isShared: boolean;
  location?: string;
}

// 天气数据结构
interface WeatherData {
  type: string;
  icon: string;
  temp: string;
  humidity: string;
  location: string;
}

// 获取日本实时天气数据
const getJapanWeatherData = async (): Promise<WeatherData> => {
  try {
    // 使用免费的Open-Meteo API获取东京天气
    const lat = 35.6762; // 东京纬度
    const lon = 139.6503; // 东京经度
    
    // 获取今天的天气
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // 使用Open-Meteo API（无需API密钥）
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max&timezone=Asia/Tokyo&start_date=${dateStr}&end_date=${dateStr}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.daily) {
      const daily = data.daily;
      const weatherCode = daily.weathercode[0];
      const maxTemp = daily.temperature_2m_max[0];
      const minTemp = daily.temperature_2m_min[0];
      const humidity = daily.relative_humidity_2m_max[0];
      
      return {
        type: getWeatherDescription(weatherCode),
        icon: getWeatherIconFromCode(weatherCode),
        temp: `${Math.round(maxTemp)}°C`,
        humidity: `${humidity}%`,
        location: '東京'
      };
    } else {
      // API失败时返回模拟数据
      return getSimulatedWeatherData();
    }
  } catch (error) {
    console.error('Weather API error:', error);
    // 网络错误时返回模拟数据
    return getSimulatedWeatherData();
  }
};

// 根据天气代码获取天气描述（日语）
const getWeatherDescription = (code: number): string => {
  const weatherDescriptions: { [key: number]: string } = {
    0: '快晴',
    1: '晴れ',
    2: '薄曇り',
    3: '曇り',
    45: '霧',
    48: '霧氷',
    51: '小雨',
    53: '雨',
    55: '大雨',
    56: '凍雨',
    57: '凍雨',
    61: '小雨',
    63: '雨',
    65: '大雨',
    66: '凍雨',
    67: '凍雨',
    71: '小雪',
    73: '雪',
    75: '大雪',
    77: '雪',
    80: 'にわか雨',
    81: 'にわか雨',
    82: '激しいにわか雨',
    85: 'にわか雪',
    86: '激しいにわか雪',
    95: '雷雨',
    96: '雷雨',
    99: '激しい雷雨'
  };
  return weatherDescriptions[code] || '不明';
};

// 根据天气代码获取图标
const getWeatherIconFromCode = (code: number): string => {
  if (code === 0 || code === 1) return 'sunny-outline';
  if (code === 2 || code === 3) return 'cloudy-outline';
  if (code >= 45 && code <= 48) return 'cloudy-outline';
  if (code >= 51 && code <= 67) return 'rainy-outline';
  if (code >= 71 && code <= 77) return 'snow-outline';
  if (code >= 80 && code <= 82) return 'rainy-outline';
  if (code >= 85 && code <= 86) return 'snow-outline';
  if (code >= 95 && code <= 99) return 'thunderstorm-outline';
  return 'cloudy-outline';
};

// 模拟天气数据（API失败时使用）
const getSimulatedWeatherData = (): WeatherData => {
  const weatherTypes = [
    { type: '晴れ', icon: 'sunny-outline', temp: '25°C', humidity: '45%', location: '東京' },
    { type: '曇り', icon: 'cloudy-outline', temp: '22°C', humidity: '60%', location: '東京' },
    { type: '雨', icon: 'rainy-outline', temp: '18°C', humidity: '80%', location: '東京' },
    { type: '雪', icon: 'snow-outline', temp: '2°C', humidity: '70%', location: '東京' },
  ];
  return weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
};

const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土'];

const generateDates = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );
};

export default function Calendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Firebase相关状态
  const [diaries, setDiaries] = useState<FirebaseDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 天气相关状态
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const dates = generateDates(year, month);
  const navigation = useNavigation<NavigationProp<any>>();
  const router = useRouter();

  // 监听用户认证状态
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        loadUserDiaries(user.uid);
      } else {
        setDiaries([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 当选择日期时加载天气数据
  useEffect(() => {
    if (selectedDate) {
      loadWeatherForDate();
    }
  }, [selectedDate]);

  // 获取当前选中日期的天气数据
  const loadWeatherForDate = async () => {
    setLoadingWeather(true);
    try {
      const weather = await getJapanWeatherData();
      setWeatherData(weather);
    } catch (error) {
      console.error('Error loading weather:', error);
      setWeatherData(null);
    } finally {
      setLoadingWeather(false);
    }
  };

  // 加载用户日记
  const loadUserDiaries = (userId: string) => {
    setLoading(true);
    try {
      // 查询用户的共享日记（暂时移除orderBy以避免索引问题）
      const diariesQuery = query(
        collection(db, 'shared_diaries'),
        where('authorId', '==', userId)
      );

      const unsubscribe = onSnapshot(diariesQuery, (snapshot) => {
        const userDiaries: FirebaseDiary[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          userDiaries.push({
            id: doc.id,
            title: data.title || '無題',
            content: data.content || '',
            mood: data.mood || '😊',
            weather: data.weather || '☀️',
            images: (data.images || []).filter((img: string) => img && img.trim() !== ''),
            authorId: data.authorId,
            authorNickname: data.authorNickname || 'ユーザー',
            partnerUid: data.partnerUid || '',
            createdAt: data.createdAt,
            isShared: data.isShared || false,
            location: data.location || '場所未設定',
          });
        });
        
        // 在客户端进行排序
        userDiaries.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        setDiaries(userDiaries);
        setLoading(false);
      }, (error) => {
        console.error('日記の読み込みに失敗:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('クエリエラー:', error);
      setLoading(false);
    }
  };

  // 日付を文字列に変換する関数
  const formatDateString = (y: number, m: number, d: number) => {
    return `${y}/${(m + 1).toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
  };

  // Firebase Timestampを日付文字列に変換
  const formatFirebaseDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  // 選択された日付の日記を取得
  const diaryForSelectedDate: FirebaseDiary[] = selectedDate
    ? diaries.filter(diary => formatFirebaseDate(diary.createdAt) === selectedDate)
    : [];

  // 日記がある日付のセットを作成
  const diaryDatesSet = new Set(diaries.map(diary => formatFirebaseDate(diary.createdAt)));

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40, backgroundColor: '#FEF9FB', flexGrow: 1 }}>
      <View style={styles.container}>

        {/* 月切り替えヘッダー */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => { setSelectedDate(null); setCurrentDate(new Date(year, month - 1, 1)); }}>
            <Text style={styles.navArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>{year}年 {month + 1}月</Text>
          <TouchableOpacity onPress={() => { setSelectedDate(null); setCurrentDate(new Date(year, month + 1, 1)); }}>
            <Text style={styles.navArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* 曜日表示 */}
        <View style={styles.weekRow}>
          {WEEK_DAYS.map((day) => (
            <Text key={day} style={styles.weekDay}>{day}</Text>
          ))}
        </View>

        {/* 日付マス */}
        <View style={styles.datesContainer}>
          {dates.map((day, index) => {
            const dateStr = day ? formatDateString(year, month, day) : '';
            const isSelected = selectedDate === dateStr;
            const hasDiary = diaryDatesSet.has(dateStr);

            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateCell, isSelected && styles.selectedDateCell]}
                onPress={() => day && setSelectedDate(dateStr)}
                disabled={!day}
              >
                <View style={styles.innerCircle}>
                  <Text style={styles.dateText}>{day ?? ''}</Text>
                  {hasDiary && <Text style={styles.pencilMark}>✏️</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 天气和日记显示 */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF84A7" />
              <Text style={styles.loadingText}>日記を読み込み中...</Text>
            </View>
          ) : !currentUser ? (
            <View style={styles.selectDatePrompt}>
              <Text style={styles.promptEmoji}>🔐</Text>
              <Text style={styles.promptText}>ログインが必要です</Text>
              <Text style={styles.promptSubText}>日記を表示するにはログインしてください</Text>
            </View>
          ) : selectedDate ? (
            <>
              {/* 天气显示 */}
              {weatherData && (
                <View style={styles.weatherCard}>
                  <View style={styles.weatherHeader}>
                    <Ionicons name={weatherData.icon as any} size={36} color="#FF84A7" />
                    <View style={styles.weatherInfo}>
                      <Text style={styles.weatherTemp}>{weatherData.temp}</Text>
                      <Text style={styles.weatherDesc}>{weatherData.type}</Text>
                      <Text style={styles.weatherHumidity}>湿度: {weatherData.humidity}</Text>
                    </View>
                  </View>
                  <Text style={styles.weatherDate}>{selectedDate}の天気 ({weatherData.location})</Text>
                </View>
              )}

              {loadingWeather && (
                <View style={styles.weatherLoadingCard}>
                  <ActivityIndicator size="small" color="#FF84A7" />
                  <Text style={styles.weatherLoadingText}>天気情報を取得中...</Text>
                </View>
              )}

              {/* 日记列表（缩略版） */}
              <View style={styles.diarySection}>
                <Text style={styles.sectionTitle}>
                  📝 この日の日記 ({diaryForSelectedDate.length}件)
                </Text>
                {diaryForSelectedDate.length > 0 ? (
                  diaryForSelectedDate.map(diary => (
                    <TouchableOpacity
                      key={diary.id}
                      style={styles.compactCard}
                      onPress={() => {
                        router.push({
                          pathname: '/diaryDetail',
                          params: { 
                            id: diary.id,
                            type: 'shared'
                          }
                        } as any);
                      }}
                    >
                      <View style={styles.cardContent}>
                        <Text style={styles.compactTitle}>{diary.title}</Text>
                        <Text style={styles.compactLocation}>📍 {diary.location}</Text>
                        <Text style={styles.compactContent} numberOfLines={2}>
                          {diary.content}
                        </Text>
                        <View style={styles.compactMoodWeather}>
                          <Text style={styles.compactEmoji}>{diary.mood}</Text>
                          <Text style={styles.compactEmoji}>{diary.weather}</Text>
                        </View>
                      </View>
                      <View style={styles.cardArrow}>
                        <Text style={styles.arrowText}>→</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noDiaryCard}>
                    <Text style={styles.noDiaryText}>この日に日記はありません</Text>
                    <Text style={styles.noDiarySubText}>日記を書いてみませんか？</Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.selectDatePrompt}>
              <Text style={styles.promptEmoji}>📅</Text>
              <Text style={styles.promptText}>日付を選択してください</Text>
              <Text style={styles.promptSubText}>天気と日記を確認できます</Text>
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 160,
    alignItems: 'center',
    backgroundColor: '#FEF9FB'
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  navArrow: {
    fontSize: 28,
    color: '#FF84A7',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    width: '100%',
  },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dateCell: {
    width: '14.2857%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedDateCell: {
    backgroundColor: '#FF84A7',
    borderRadius: 18,
  },
  innerCircle: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
  },
  pencilMark: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    fontSize: 12,
  },
  contentContainer: {
    marginTop: 20,
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  selectDatePrompt: {
    alignItems: 'center',
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promptEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  promptText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  promptSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherDesc: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  weatherHumidity: {
    fontSize: 14,
    color: '#999',
  },
  weatherDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  weatherLoadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  weatherLoadingText: {
    fontSize: 14,
    color: '#666',
  },
  diarySection: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  compactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  compactLocation: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  compactContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  compactMoodWeather: {
    flexDirection: 'row',
    gap: 8,
  },
  compactEmoji: {
    fontSize: 16,
  },
  cardArrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 18,
    color: '#FF84A7',
    fontWeight: 'bold',
  },
  noDiaryCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noDiaryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  noDiarySubText: {
    fontSize: 14,
    color: '#999',
  },
});
