import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection,
  addDoc 
} from 'firebase/firestore';
import { 
  updateCollaborationDiary, 
  createOrUpdateCollaborationDiary, 
  getCollaborationDiary 
} from '../utils/collaborationDiary';

export default function SimpleCollaborationEdit() {
  const router = useRouter();
  const { diaryId, diaryTitle, inviterId } = useLocalSearchParams();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUser = auth.currentUser;
  const isInviter = currentUser?.uid === inviterId;

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入日记内容');
      return;
    }

    setLoading(true);
    try {
      console.log('使用新工具函数保存开始:', {
        diaryId,
        isInviter,
        content: content.substring(0, 50),
        currentUserId: currentUser?.uid
      });

      // 准备更新数据
      const updateData: any = {
        status: 'editing',
      };

      // 根据是否为邀请者，决定更新哪个字段
      if (isInviter) {
        updateData.inviterContent = content;
        updateData.inviterImages = images;
        updateData.inviterId = currentUser!.uid;
      } else {
        updateData.collaboratorContent = content;
        updateData.collaboratorImages = images;
        updateData.collaboratorId = currentUser!.uid;
      }

      // 尝试先获取文档，检查是否存在
      console.log('检查文档是否存在:', diaryId);
      const existingDoc = await getCollaborationDiary(diaryId as string);
      
      if (!existingDoc) {
        console.log('文档不存在，创建新文档');
        // 如果文档不存在，创建新的协作日记文档
        updateData.title = diaryTitle;
        updateData.originalDiaryId = diaryId;
        updateData.inviterId = inviterId;
      }

      // 使用工具函数更新或创建文档
      const success = await createOrUpdateCollaborationDiary(diaryId as string, updateData);
      
      if (success) {
        console.log('协作日记保存成功');
        Alert.alert('保存成功', '协作日记已保存！', [
          { text: '确定', onPress: () => router.back() }
        ]);
      } else {
        throw new Error('保存失败');
      }
    } catch (error: any) {
      console.error('保存错误:', error);
      Alert.alert('错误', `保存失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>协作编辑（简化版）</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.label}>标题</Text>
          <Text style={styles.titleDisplay}>{diaryTitle}</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>内容</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="分享您的想法..."
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.label}>图片</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageList}>
              {images.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.image} />
              ))}
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Ionicons name="add" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#333',
  },
  content: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleDisplay: {
    fontSize: 18,
    color: '#666',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputSection: {
    marginBottom: 20,
  },
  contentInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    lineHeight: 24,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#ff6b9d',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
