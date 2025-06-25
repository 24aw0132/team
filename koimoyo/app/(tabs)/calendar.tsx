import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { cardsData, DiaryCard } from './diaryData';

const EMOJI_IMAGES = [
require('../../assets/emojis/expressionless_face_3d.png'),
  require('../../assets/emojis/eye_3d.png'),
  require('../../assets/emojis/eye_in_speech_bubble_3d.png'),
  require('../../assets/emojis/eyes_3d.png'),
  require('../../assets/emojis/face_blowing_a_kiss_3d.png'),
  require('../../assets/emojis/face_exhaling_3d.png'),
  require('../../assets/emojis/face_holding_back_tears_3d.png'),
  require('../../assets/emojis/face_in_clouds_3d.png'),
  require('../../assets/emojis/face_savoring_food_3d.png'),
  require('../../assets/emojis/face_screaming_in_fear_3d.png'),
  require('../../assets/emojis/face_vomiting_3d.png'),
  require('../../assets/emojis/face_with_diagonal_mouth_3d.png'),
  require('../../assets/emojis/face_with_hand_over_mouth_3d.png'),
  require('../../assets/emojis/face_with_head-bandage_3d.png'),
  require('../../assets/emojis/face_with_medical_mask_3d.png'),
  require('../../assets/emojis/face_with_monocle_3d.png'),
  require('../../assets/emojis/face_with_open_eyes_and_hand_over_mouth_3d.png'),
  require('../../assets/emojis/face_with_open_mouth_3d.png'),
  require('../../assets/emojis/face_with_peeking_eye_3d.png'),
  require('../../assets/emojis/face_with_raised_eyebrow_3d.png'),
  require('../../assets/emojis/face_with_rolling_eyes_3d.png'),
  require('../../assets/emojis/face_with_spiral_eyes_3d.png'),
  require('../../assets/emojis/face_with_steam_from_nose_3d.png'),
  require('../../assets/emojis/face_with_symbols_on_mouth_3d.png'),
  require('../../assets/emojis/face_with_tears_of_joy_3d.png'),
  require('../../assets/emojis/face_with_thermometer_3d.png'),
  require('../../assets/emojis/face_with_tongue_3d.png'),
  require('../../assets/emojis/face_without_mouth_3d.png'),
];

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
  const [isEmojiModalVisible, setIsEmojiModalVisible] = useState(false);
  const [emojiSelections, setEmojiSelections] = useState<Record<string, any>>({}); // 日付ごとの絵文字画像

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const dates = generateDates(year, month);
  const navigation = useNavigation<NavigationProp<any>>();

  const formatDateString = (y: number, m: number, d: number) => {
    return `${y}/${(m + 1).toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
  };

  const diaryForSelectedDate: DiaryCard[] = selectedDate
    ? cardsData.filter(card => card.date === selectedDate)
    : [];

  const diaryDatesSet = new Set(cardsData.map(card => card.date));

  const handleEmojiSelect = (emojiImage: any) => {
    if (selectedDate) {
      setEmojiSelections(prev => ({
        ...prev,
        [selectedDate]: emojiImage,
      }));
    }
    setIsEmojiModalVisible(false);
  };

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
            const emojiImage = emojiSelections[dateStr];

            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateCell, isSelected && styles.selectedDateCell]}
                onPress={() => day && setSelectedDate(dateStr)}
                disabled={!day}
              >
                <View style={styles.innerCircle}>
                  <Text style={styles.dateText}>{day ?? ''}</Text>
                  {emojiImage && (
                    <Image source={emojiImage} style={{ width: 18, height: 18, position: 'absolute', top: -4, right: -4 }} />
                  )}
                  {hasDiary && <Text style={styles.pencilMark}>✏️</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 絵文字ボタンまたは選択済み絵文字表示 */}
{selectedDate && (
  emojiSelections[selectedDate] ? (
    <TouchableOpacity
      onPress={() => setIsEmojiModalVisible(true)}
      style={[styles.selectedEmojiContainer]}
      activeOpacity={0.8}
    >
      <Text style={styles.selectedEmojiLabel}>今日の気持ち</Text>
      <Image source={emojiSelections[selectedDate]} style={styles.selectedEmojiImage} />
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      style={styles.emojiButton}
      onPress={() => setIsEmojiModalVisible(true)}
    >
      <Text style={styles.emojiButtonText}>今日の気持ちを絵文字で記録！</Text>
    </TouchableOpacity>
  )
)}
        {/* 日記表示 */}
        <View style={styles.diaryContainer}>
          {selectedDate ? (
            diaryForSelectedDate.length > 0 ? (
              diaryForSelectedDate.map(card => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('DiaryDetail', { ...card })
                  }
                >
                  <Image source={{ uri: card.backgroundImage }} style={styles.diaryImage} />
                  <Text style={styles.title}>{card.title}</Text>
                  <Text style={styles.location}>{card.location}</Text>
                  <Text style={styles.date}>{card.date}</Text>
                  <Text style={styles.content} numberOfLines={2}>{card.content}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDiaryText}>この日に日記はありません</Text>
            )
          ) : (
            <Text style={styles.noDiaryText}>日付を選択してください</Text>
          )}
        </View>

        {/* モーダル：絵文字選択 */}
        <Modal
          visible={isEmojiModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEmojiModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>今日の気持ちを選んでね</Text>
              <FlatList
                data={EMOJI_IMAGES}
                numColumns={5}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.emojiItem}
                    onPress={() => handleEmojiSelect(item)}
                  >
                    <Image source={item} style={styles.emojiImage} />
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsEmojiModalVisible(false)}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
  todayCircle: {
    backgroundColor: '#FF84A7',
    borderRadius: 18,
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pencilMark: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    fontSize: 12,
  },
  emojiButton: {
    backgroundColor: '#FF84A7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#FFAABF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  emojiButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  emojiButtonRight: {
    alignSelf: 'flex-end',
    marginRight: 16,
  },
  emojiButtonCenter: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  diaryContainer: {
    marginTop: -10,
    width: '100%',
    paddingHorizontal: 10,
    zIndex: -999,
  },
  card: {
    backgroundColor: '#FFF0F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  diaryImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4D6D',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  content: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
  },
  noDiaryText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  emojiItem: {
    margin: 6,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  emojiImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#FF84A7',
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedEmojiContainer: {
  alignItems: 'center',
  padding: 8,
  backgroundColor: '#FFE2EC',
  borderRadius: 16,
  flexDirection: 'row',
  gap: 8,
},
selectedEmojiLabel: {
  fontSize: 14,
  color: '#333',
  fontWeight: 'bold',
},
selectedEmojiImage: {
  width: 32,
  height: 32,
  resizeMode: 'contain',
},

});