import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Image,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiaryCard } from '../types/diary';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

const DiaryWriting = () => {
  const router = useRouter();

  // --- state ---
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const today = new Date();
  const date = `${today.getFullYear()}/${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}`;

  //ダミー画像配列
  const dummyImages = [
  'https://images.unsplash.com/photo-1549887534-1646e3c0e23d?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1553532434-5ab5b6b84993?w=200&h=200&fit=crop'
  ];

  // --- 初回下書き読み込み ---
  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem('diary_draft');
      if (draft) {
        const {
          title: draftTitle,
          location: draftLocation,
          content: draftContent,
          imageUris: draftImages
        } = JSON.parse(draft);
        setTitle(draftTitle || '');
        setLocation(draftLocation || '');
        setContent(draftContent || '');
        setImageUris(draftImages || []);
      }
    } catch (e) {
      console.error('下書き読み込みエラー:', e);
    }
  };

  const saveDraft = async () => {
    try {
      const draft = {
        title,
        location,
        content,
        imageUris
      };
      await AsyncStorage.setItem('diary_draft', JSON.stringify(draft));
    } catch (e) {
      console.error('下書き保存エラー:', e);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem('diary_draft');
    } catch (e) {
      console.error('下書き削除エラー:', e);
    }
  };

  const handleClose = () => {
    if (title.trim() || location.trim() || content.trim() || imageUris.length > 0) {
      Alert.alert(
        '確認',
        '入力中の内容を保存しますか？',
        [
          {
            text: '保存せず戻る',
            style: 'destructive',
            onPress: () => {
              clearDraft();
              router.back();
            }
          },
          {
            text: '下書き保存',
            onPress: () => {
              saveDraft();
              router.back();
            }
          },
          {
            text: 'キャンセル',
            style: 'cancel'
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    const newEntry: DiaryCard = {
      id: Date.now(),
      title,
      location,
      date,
      backgroundImage:
        imageUris[0] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      content
    };

    try {
      const existing = await AsyncStorage.getItem('diary_cards');
      const cards = existing ? JSON.parse(existing) : [];
      const updated = [newEntry, ...cards];
      await AsyncStorage.setItem('diary_cards', JSON.stringify(updated));

      await clearDraft();

      router.back();
    } catch (e) {
      console.error('保存エラー:', e);
    }
  };

  // --- モーダル操作関数 ---
  const openImagePicker = () => setModalVisible(true);
  const closeImagePicker = () => setModalVisible(false);
  const selectImage = (uri: string) => {
    setImageUris(prev => [...prev, uri]);
    closeImagePicker();
  };

  const handleRemoveImage = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.floatingCloseButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.inner}>
            <Text style={styles.pageTitle}>日記を書こう</Text>
            <Text style={styles.date}>{date}</Text>
            <TextInput
              placeholder="タイトルを入力"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="場所を入力"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
            />

            <View style={styles.imageRow}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.imageBox}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={openImagePicker}>
                <Text style={styles.addText}>＋</Text>
              </TouchableOpacity>
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent={false}>
              <View style={{ flex: 1, padding: 20 }}>
                <Text style={{ fontSize: 20, marginTop: 80, marginBottom: 30, textAlign: 'center' }}>画像を選んでください</Text>
                <ScrollView
                  contentContainerStyle={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 10
                  }}
                >
                  {dummyImages.map((uri, idx) => (
                    <TouchableOpacity key={idx} onPress={() => selectImage(uri)}>
                      <Image
                        source={{ uri }}
                        style={{ width: 100, height: 100, margin: 5, borderRadius: 10 }}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity onPress={closeImagePicker} style={{ marginTop: 20 }}>
                  <Text style={{ textAlign: 'center', color: 'blue', marginBottom: 25 }}>閉じる</Text>
                </TouchableOpacity>
              </View>
            </Modal>

            <TextInput
              placeholder="今日の出来事を記録しよう！"
              value={content}
              onChangeText={setContent}
              multiline
              style={styles.textArea}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>保存</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default DiaryWriting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6F4'
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B08585',
    alignSelf: 'center',
    marginBottom: 22
  },
  floatingCloseButton: {
    position: 'absolute',
    top: 60,  // より上に配置
    left: 20, // より左に配置
    zIndex: 1000,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  keyboardView: {
    flex: 1
  },
  inner: {
    padding: 20,
    paddingTop: 50
  },
  date: {
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
    fontWeight: 'bold',
    alignSelf: 'center'
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
    fontSize: 16,
    padding: 8
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    fontSize: 16,
    borderRadius: 8,
    textAlignVertical: 'top'
  },
  saveBtn: {
    backgroundColor: '#F8AFA6',
    padding: 14,
    marginTop: 20,
    alignItems: 'center',
    borderRadius: 12
  },
  saveText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold'
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 10
  },
  imageBox: {
    position: 'relative'
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  removeText: {
    color: '#fff',
    fontSize: 14
  },
  addBtn: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center'
  },
  addText: {
    fontSize: 24,
    color: '#aaa'
  }
});
