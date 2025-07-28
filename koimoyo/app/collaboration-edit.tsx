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
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { db, auth } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  addDoc 
} from 'firebase/firestore';
import uploadToCloudinary from '../utils/cloudinary';

const { width } = Dimensions.get('window');

interface DiaryData {
  id: string;
  title: string;
  originalDiaryId?: string; // 原始日记ID，用于关联
  location?: string;
  inviterContent?: string;
  inviterImages?: string[];
  collaboratorContent?: string;
  collaboratorImages?: string[];
  inviterId: string;
  collaboratorId: string;
  status: 'editing' | 'completed';
  createdAt: any;
}

export default function CollaborationEdit() {
  const router = useRouter();
  const { diaryId, diaryTitle, inviterId, isCollaborator } = useLocalSearchParams();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [diaryData, setDiaryData] = useState<DiaryData | null>(null);
  const currentUser = auth.currentUser;
  const isInviter = currentUser?.uid === inviterId;

  useEffect(() => {
    loadDiaryData();
  }, []);

  const loadDiaryData = async () => {
    try {
      console.log('加载日记数据，协作日记ID:', diaryId);
      console.log('用户身份:', isInviter ? '邀请者' : '协作者');
      
      const docRef = doc(db, 'collaboration_diaries', diaryId as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as DiaryData;
        console.log('找到现有文档:', data);
        setDiaryData(data);
        
        // 根据用户身份加载对应的内容
        if (isInviter) {
          setContent(data.inviterContent || '');
          setImages(data.inviterImages || []);
        } else {
          setContent(data.collaboratorContent || '');
          setImages(data.collaboratorImages || []);
        }
      } else {
        // 如果文档不存在，创建新文档（无论是邀请者还是协作者）
        console.log('文档不存在，创建新文档');
        const newDiary: DiaryData = {
          id: diaryId as string,
          title: diaryTitle as string,
          inviterId: isInviter ? currentUser!.uid : (inviterId as string),
          collaboratorId: isInviter ? '' : currentUser!.uid,
          status: 'editing',
          createdAt: serverTimestamp(),
        };
        
        console.log('新建日记数据:', newDiary);
        await setDoc(docRef, newDiary);
        setDiaryData(newDiary);
      }
    } catch (error) {
      console.error('加载协作日记错误:', error);
      Alert.alert('错误', '加载日记失败');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入日记内容');
      return;
    }

    setLoading(true);
    try {
      console.log('开始保存，用户身份:', isInviter ? '邀请者' : '协作者');
      console.log('日记ID:', diaryId);
      console.log('当前用户:', currentUser?.uid);
      
      // 上传图片到Cloudinary
      const uploadedImages = await Promise.all(
        images.map(async (uri) => {
          if (uri.startsWith('http')) return uri; // 已经是网络图片
          return await uploadToCloudinary(uri);
        })
      );

      const docRef = doc(db, 'collaboration_diaries', diaryId as string);
      const updateData: any = {};

      if (isInviter) {
        updateData.inviterContent = content;
        updateData.inviterImages = uploadedImages;
      } else {
        updateData.collaboratorContent = content;
        updateData.collaboratorImages = uploadedImages;
        updateData.collaboratorId = currentUser!.uid;
      }

      console.log('准备保存的数据:', updateData);

      // 使用 setDoc 的 merge 选项来避免文档不存在的问题
      await setDoc(docRef, updateData, { merge: true });
      
      console.log('保存成功');

      // 检查双方是否都已完成编辑
      const updatedDoc = await getDoc(docRef);
      const updatedData = updatedDoc.data() as DiaryData;
      
      console.log('更新后的文档数据:', updatedData);
      
      if (updatedData.inviterContent && updatedData.collaboratorContent) {
        // 双方都完成了，更新状态并创建最终的共享日记
        await setDoc(docRef, { status: 'completed' }, { merge: true });
        
        // 创建最终的双页面日记
        await createFinalSharedDiary(updatedData);
        
        console.log('双方都完成编辑，已创建最终日记');
      }

      Alert.alert('保存成功', '您的内容已保存！', [
        { text: '确定', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('保存错误:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const createFinalSharedDiary = async (diaryData: DiaryData) => {
    try {
      const finalDiary = {
        title: diaryData.title,
        location: diaryData.location || '',
        inviterContent: diaryData.inviterContent,
        inviterImages: diaryData.inviterImages || [],
        collaboratorContent: diaryData.collaboratorContent,
        collaboratorImages: diaryData.collaboratorImages || [],
        inviterId: diaryData.inviterId,
        collaboratorId: diaryData.collaboratorId,
        type: 'collaboration',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'final_collaboration_diaries'), finalDiary);
    } catch (error) {
      console.error('创建最终日记错误:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isInviter ? '创建协作日记' : '参与编辑'}
        </Text>
      </View>

      <View style={styles.content}>
        {/* 标题显示（只有邀请者可编辑） */}
        <View style={styles.titleSection}>
          <Text style={styles.label}>标题</Text>
          <Text style={styles.titleDisplay}>{diaryTitle}</Text>
        </View>

        {/* 内容编辑 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>内容</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder={isInviter ? "分享今天的故事..." : "添加您的想法..."}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* 图片上传 */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>图片</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageList}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Ionicons name="add" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '保存中...' : '保存我的部分'}
          </Text>
        </TouchableOpacity>

        {/* 说明文字 */}
        <Text style={styles.helpText}>
          {isInviter 
            ? "创建后，您的另一半也会收到编辑邀请，双方完成后将生成精美的双页面日记！"
            : "您正在参与协作编辑，完成后将与邀请者的内容一起生成双页面日记！"
          }
        </Text>
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
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
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
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
