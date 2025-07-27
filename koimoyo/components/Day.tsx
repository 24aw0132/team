// components/home/Day.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DAYS_TO_SHOW = 7;
const GAP = 4;
const dayBoxMarginHorizontal = 2;

// 格式化日期为 M/D
const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;

// 获取日本实时天气数据
const getJapanWeatherData = async (date: Date) => {
  try {
    // 使用免费的Open-Meteo API获取东京天气
    const lat = 35.6762; // 东京纬度
    const lon = 139.6503; // 东京经度
    
    // 格式化日期为API需要的格式
    const dateStr = date.toISOString().split('T')[0];
    
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
const getSimulatedWeatherData = () => {
  const weatherTypes = [
    { type: '晴れ', icon: 'sunny-outline', temp: '25°C', humidity: '45%', location: '東京' },
    { type: '曇り', icon: 'cloudy-outline', temp: '22°C', humidity: '60%', location: '東京' },
    { type: '雨', icon: 'rainy-outline', temp: '18°C', humidity: '80%', location: '東京' },
    { type: '雪', icon: 'snow-outline', temp: '2°C', humidity: '70%', location: '東京' },
  ];
  return weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
};

export const Day = () => {
  const { width } = useWindowDimensions();
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });

  // 计算每个日期格子的宽度
  const dayBoxWidth =
    (width - GAP * (DAYS_TO_SHOW - 1) - dayBoxMarginHorizontal * DAYS_TO_SHOW * 2) /
    DAYS_TO_SHOW;

  const today = new Date();
  const days: Date[] = [];

  // 让今天在中间，前后各显示3天
  const half = Math.floor(DAYS_TO_SHOW / 2);
  for (let i = -half; i <= half; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  const handleLongPress = async (date: Date, event: any) => {
    // 获取点击位置
    const { pageX, pageY } = event.nativeEvent;
    setBubblePosition({ x: pageX, y: pageY });
    
    setSelectedDate(date);
    setShowWeatherModal(true);
    setIsLoadingWeather(true);
    
    try {
      const weather = await getJapanWeatherData(date);
      setWeatherData(weather);
    } catch (error) {
      console.error('获取天气数据失败:', error);
      setWeatherData(getSimulatedWeatherData());
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // 长按开始时显示浮窗
  const handlePressIn = async (date: Date, event: any) => {
    // 获取点击位置
    const { pageX, pageY } = event.nativeEvent;
    setBubblePosition({ x: pageX, y: pageY });
    
    setSelectedDate(date);
    setShowWeatherModal(true);
    setIsLoadingWeather(true);
    
    try {
      const weather = await getJapanWeatherData(date);
      setWeatherData(weather);
    } catch (error) {
      console.error('获取天气数据失败:', error);
      setWeatherData(getSimulatedWeatherData());
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // 松开时隐藏浮窗  
  const handlePressOut = () => {
    setShowWeatherModal(false);
    setSelectedDate(null);
    setWeatherData(null);
    setIsLoadingWeather(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarContainer}
        >
          {days.map((date, index) => {
            const isToday = date.toDateString() === today.toDateString();
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayBox,
                  { width: dayBoxWidth, height: dayBoxWidth * 1.3 },
                ]}
                onPressIn={(event) => handlePressIn(date, event)}
                onPressOut={handlePressOut}
                delayLongPress={300}
                activeOpacity={0.7}
              >
                <Text style={[styles.weekdayText, isToday && styles.todayWeekday]}>
                  {date.toLocaleDateString('ja-JP', { weekday: 'short' })}
                </Text>
                {isToday ? (
                  <View style={styles.todayDateCircle}>
                    <Text style={[styles.dayText, styles.todayDateText]}>
                      {formatDate(date)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.dayTextWrapper}>
                    <Text style={styles.dayText}>{formatDate(date)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 天气气泡Modal - 跟随位置显示 */}
      {showWeatherModal && (
        <View style={styles.bubbleOverlay}>
          <View 
            style={[
              styles.weatherBubble,
              {
                position: 'absolute',
                left: Math.max(10, Math.min(bubblePosition.x - 50, width - 150)),
                top: bubblePosition.y - 100,
              }
            ]}
          >
            {/* 动态调整箭头位置 */}
            <View 
              style={[
                styles.weatherBubbleArrow,
                {
                  left: Math.max(15, Math.min(bubblePosition.x - Math.max(10, Math.min(bubblePosition.x - 50, width - 150)) - 5, 90))
                }
              ]} 
            />
            <TouchableOpacity
              style={styles.weatherContent}
              activeOpacity={1}
            >
              {isLoadingWeather ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="refresh" size={16} color="#4A90E2" />
                  <Text style={styles.loadingText}>読み込み中...</Text>
                </View>
              ) : weatherData ? (
                <>
                  <View style={styles.weatherHeader}>
                    <Ionicons 
                      name={weatherData.icon as any} 
                      size={20} 
                      color="#4A90E2" 
                    />
                    <Text style={styles.weatherTemp}>{weatherData.temp}</Text>
                  </View>
                  <Text style={styles.weatherType}>{weatherData.type}</Text>
                  <Text style={styles.weatherHumidity}>湿度: {weatherData.humidity}</Text>
                  <Text style={styles.weatherDate}>
                    {selectedDate?.toLocaleDateString('ja-JP', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  calendarWrapper: {
    paddingVertical: 5,
    backgroundColor: '#F6C9CC',
    borderRadius: 25,
    marginHorizontal: 8,
    marginTop: 12,
  },
  calendarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dayBox: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: dayBoxMarginHorizontal,
  },
  weekdayText: {
    fontSize: 12,
    color: '#666',
    height: 20,
    textAlign: 'center',
  },
  todayWeekday: {
    fontWeight: 'bold',
  },
  dayTextWrapper: {
    marginTop: 4,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayDateCircle: {
    marginTop: 4,
    backgroundColor: '#FF84A7',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  todayDateText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  // 天气气泡样式
  bubbleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  weatherBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    minWidth: 100,
    maxWidth: 140,
  },
  weatherBubbleArrow: {
    position: 'absolute',
    top: -5,
    // 移除 left: '50%' 和 marginLeft: -5，改为动态计算
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  weatherContent: {
    alignItems: 'center',
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  weatherType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  weatherHumidity: {
    fontSize: 10,
    color: '#777',
    marginBottom: 2,
  },
  weatherDate: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});