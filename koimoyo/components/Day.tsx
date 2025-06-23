// components/home/Day.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/App';

type DayScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const DAYS_TO_SHOW = 7;
const TOTAL_DAYS = 30; // 总共显示30天（前后各15天）
const DAY_BOX_WIDTH = 50;

const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;

export const Day = () => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<DayScreenNavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);

  // 生成前后15天的日期数组
  const generateDays = () => {
    const days = [];
    for (let i = -15; i <= 15; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = generateDays();
  const todayIndex = 15; // 今天在数组中的索引

  // 组件挂载后滚动到今天的位置
  React.useEffect(() => {
    setTimeout(() => {
      const scrollPosition = todayIndex * DAY_BOX_WIDTH - (width - DAY_BOX_WIDTH) / 2;
      scrollViewRef.current?.scrollTo({
        x: Math.max(0, scrollPosition),
        animated: false,
      });
    }, 100);
  }, [width]);

  return (
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={DAY_BOX_WIDTH}
          snapToAlignment="center"
        >
          {days.map((date, index) => {
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            
            return (
              <View
                key={index}
                style={[
                  styles.dayBox,
                  { width: DAY_BOX_WIDTH },
                ]}
              >
                <Text style={[
                  styles.weekdayText, 
                  (isToday || isSelected) && styles.todayWeekday
                ]}>
                  {date.toLocaleDateString('ja-JP', { weekday: 'short' })}
                </Text>
                
                {isToday ? (
                  <View style={styles.todayDateCircle}>
                    <Text style={[styles.dayText, styles.todayDateText]}>
                      {formatDate(date)}
                    </Text>
                  </View>
                ) : (
                  <View style={[
                    styles.dayTextWrapper,
                    isSelected && styles.selectedDateWrapper
                  ]}>
                    <Text style={[
                      styles.dayText,
                      isSelected && styles.selectedDateText
                    ]}>
                      {formatDate(date)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    // 移除 flex: 1，让组件自适应高度
  },
  calendarWrapper: {
    paddingVertical: 8,
    backgroundColor: '#F6C9CC',
    borderRadius: 25,
    marginHorizontal: 8,
    marginTop: 12,
    height: 80, // 固定高度
  },
  scrollContent: {
    paddingHorizontal: 20, // 两侧留白
    alignItems: 'center',
  },
  dayBox: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    height: '100%',
  },
  weekdayText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  todayWeekday: {
    fontWeight: 'bold',
    color: '#FF84A7',
  },
  dayTextWrapper: {
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  selectedDateWrapper: {
    backgroundColor: 'rgba(255, 132, 167, 0.2)',
  },
  todayDateCircle: {
    backgroundColor: '#FF84A7',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  selectedDateText: {
    color: '#FF84A7',
    fontWeight: 'bold',
  },
  todayDateText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
