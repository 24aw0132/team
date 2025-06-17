// components/home/Day.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Button,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type DayScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const DAYS_TO_SHOW = 7;
const GAP = 4;
const dayBoxMarginHorizontal = 2;

const formatDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;

export const Day = () => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<DayScreenNavigationProp>();

  const dayBoxWidth =
    (width - GAP * (DAYS_TO_SHOW - 1) - dayBoxMarginHorizontal * DAYS_TO_SHOW * 2) /
    DAYS_TO_SHOW;

  const today = new Date();
  const days = [];

  for (let i = -6; i <= 0; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  return (
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
        <View style={styles.calendarContainer}>
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
        </View>
      </View>

      <View style={styles.buttonWrapper}>
        <Button
          title="カレンダーへ飛ぶ"
          onPress={() => navigation.navigate('Calendar')}
          color="#FF84A7"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendarWrapper: {
    paddingVertical: 5,
    backgroundColor: '#F6C9CC',
    borderRadius: 25,
    marginHorizontal: 8,
    marginTop: 12,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonWrapper: {
    marginTop: 32,
    marginHorizontal: 16,
  },
});
