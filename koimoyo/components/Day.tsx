// components/home/Day.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';

const DAYS_TO_SHOW = 7;
const GAP = 4;
const dayBoxMarginHorizontal = 2;

// 格式化日期为 M/D
const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;

export const Day = () => {
  const { width } = useWindowDimensions();

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
              <View
                key={index}
                style={[
                  styles.dayBox,
                  { width: dayBoxWidth, height: dayBoxWidth * 1.3 },
                ]}
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
  buttonWrapper: {
    marginTop: 32,
    marginHorizontal: 16,
  },
});