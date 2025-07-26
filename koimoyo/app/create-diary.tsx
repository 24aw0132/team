import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import uploadToCloudinary from '../utils/cloudinary';
import * as Location from 'expo-location'; // 导入 expo-location

export default function CreateDiary() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState(''); // 用户输入的地点
  const [address, setAddress] = useState(''); // 自动获取的地址
  const [mood, setMood] = useState('😊');
  const [weather, setWeather] = useState('☀️');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partnerNickname, setPartnerNickname] = useState('');

  const moods = ['😊', '😍', '🥰', '😢', '😴', '😤', '🤔', '😎'];
  const weathers = ['☀️', '☁️', '🌧️', '⛈️', '🌈', '❄️', '🌙', '⭐'];

  useEffect(() => {
    fetchPartnerInfo();
    fetchLocation(); // 自动获取位置
  }, []);

  // 获取用户位置并反向地理编码
  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('位置权限被拒绝', '请允许位置权限以自动获取地址');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [geoAddress] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geoAddress) {
        const formattedAddress = `${geoAddress.city || ''} ${geoAddress.region || ''}`;
        setAddress(formattedAddress); // 保存地址信息
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('エラー', '位置情報の取得に失敗しました');
    }
  };

  const fetchPartnerInfo = async () => {
    try {
      const partnerUid = await AsyncStorage.getItem('PARTNER_UID');
      if (partnerUid) {
        const q = query(collection(db, 'users'), where('authUid', '==', partnerUid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setPartnerNickname(data.nickname || 'パートナー');
        }
      }
    } catch (error) {
      console.error('Error fetching partner info:', error);
    }
  };

  const handlePickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('制限', '画像は最大3枚まで選択できます');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uploadedUrl = await uploadToCloudinary(result.assets[0].uri);
      if (uploadedUrl) {
        setImages(prev => [...prev, uploadedUrl]);
      } else {
        Alert.alert('エラー', '画像のアップロードに失敗しました');
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('エラー', 'タイトルと内容を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const partnerUid = await AsyncStorage.getItem('PARTNER_UID');
      const currentUserQuery = query(collection(db, 'users'), where('authUid', '==', auth.currentUser?.uid));
      const currentUserSnapshot = await getDocs(currentUserQuery);

      if (currentUserSnapshot.empty) {
        Alert.alert('エラー', 'ユーザー情報を取得できませんでした');
        setIsSubmitting(false);
        return;
      }

      const currentUserData = currentUserSnapshot.docs[0].data();

      // 保存到 Firestore
      await addDoc(collection(db, 'shared_diaries'), {
        title: title.trim(),
        content: content.trim(),
        location: location.trim() || address || '場所未設定', // 优先使用用户输入的地点，其次使用自动获取的地址
        mood,
        weather,
        images,
        authorId: auth.currentUser?.uid,
        authorNickname: currentUserData.nickname || 'あなた',
        partnerUid: partnerUid,
        createdAt: serverTimestamp(),
        isShared: true,
      });

      Alert.alert(
        '完了！',
        `${partnerNickname}さんと共有する日記を作成しました！`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating diary:', error);
      Alert.alert('エラー', '日記の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {partnerNickname ? `${partnerNickname}さんと日記を書く` : '共有日記を書く'}
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* タイトル入力 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>タイトル</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="今日の出来事..."
            placeholderTextColor="#aaa"
          />
        </View>

        {/* 地点输入 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>📍 場所</Text>
          <TextInput
            style={styles.titleInput}
            value={location}
            onChangeText={setLocation}
            placeholder={address || 'どこで過ごしましたか？'} // 显示自动获取的地址作为占位符
            placeholderTextColor="#aaa"
          />
        </View>

        {/* 気分と天気選択 */}
        <View style={styles.row}>
          <View style={styles.halfSection}>
            <Text style={styles.label}>気分</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.emojiContainer}>
                {moods.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.emojiBtn, mood === emoji && styles.emojiSelected]}
                    onPress={() => setMood(emoji)}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.halfSection}>
            <Text style={styles.label}>天気</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.emojiContainer}>
                {weathers.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.emojiBtn, weather === emoji && styles.emojiSelected]}
                    onPress={() => setWeather(emoji)}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* 画像选择 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>写真 ({images.length}/3)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ff4757" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 3 && (
                <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage}>
                  <Ionicons name="add" size={32} color="#666" />
                  <Text style={styles.addImageText}>写真を追加</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        {/* 内容输入 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>内容</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="今日はどんな一日でしたか？"
            placeholderTextColor="#aaa"
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  submitBtn: {
    backgroundColor: '#ff6b9d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  halfSection: {
    flex: 1,
  },
  emojiContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiSelected: {
    backgroundColor: '#ff6b9d',
  },
  emoji: {
    fontSize: 20,
  },
  imageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  contentInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
  },
});