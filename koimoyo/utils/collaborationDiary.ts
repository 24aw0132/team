import { 
  doc, 
  updateDoc, 
  setDoc, 
  getDoc, 
  arrayUnion, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 更新协作日记文档
 * @param diaryId - 协作日记的文档ID
 * @param updates - 要更新的字段
 * @param useArrayUnion - 是否对图片数组使用 arrayUnion
 * @returns Promise<boolean> - 返回更新是否成功
 */
export const updateCollaborationDiary = async (
  diaryId: string,
  updates: {
    collaboratorContent?: string;
    collaboratorImages?: string[];
    inviterContent?: string;
    inviterImages?: string[];
    status?: 'editing' | 'completed';
    [key: string]: any;
  },
  useArrayUnion: boolean = false
): Promise<boolean> => {
  try {
    console.log('开始更新协作日记:', diaryId);
    console.log('更新数据:', updates);

    const docRef = doc(db, 'collaboration_diaries', diaryId);
    
    // 首先检查文档是否存在
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('文档不存在，无法更新');
      return false;
    }

    // 准备更新数据
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp(), // 使用服务器时间戳
    };

    // 如果需要使用 arrayUnion 处理图片
    if (useArrayUnion) {
      if (updates.collaboratorImages && updates.collaboratorImages.length > 0) {
        updateData.collaboratorImages = arrayUnion(...updates.collaboratorImages);
      }
      if (updates.inviterImages && updates.inviterImages.length > 0) {
        updateData.inviterImages = arrayUnion(...updates.inviterImages);
      }
    }

    // 执行更新
    await updateDoc(docRef, updateData);
    
    console.log('协作日记更新成功');
    return true;
  } catch (error) {
    console.error('更新协作日记失败:', error);
    return false;
  }
};

/**
 * 创建或更新协作日记文档（安全版本）
 * @param diaryId - 协作日记的文档ID
 * @param data - 要设置的数据
 * @returns Promise<boolean>
 */
export const createOrUpdateCollaborationDiary = async (
  diaryId: string,
  data: {
    title?: string;
    collaboratorContent?: string;
    collaboratorImages?: string[];
    inviterContent?: string;
    inviterImages?: string[];
    inviterId?: string;
    collaboratorId?: string;
    status?: 'editing' | 'completed';
    [key: string]: any;
  }
): Promise<boolean> => {
  try {
    console.log('创建或更新协作日记:', diaryId);
    console.log('数据:', data);

    const docRef = doc(db, 'collaboration_diaries', diaryId);
    
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // 使用 setDoc 的 merge 选项，如果文档不存在会创建，如果存在会合并更新
    await setDoc(docRef, updateData, { merge: true });
    
    console.log('协作日记创建/更新成功');
    return true;
  } catch (error) {
    console.error('创建/更新协作日记失败:', error);
    return false;
  }
};

/**
 * 获取协作日记文档
 * @param diaryId - 协作日记的文档ID
 * @returns Promise<any | null>
 */
export const getCollaborationDiary = async (diaryId: string): Promise<any | null> => {
  try {
    const docRef = doc(db, 'collaboration_diaries', diaryId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('协作日记文档不存在:', diaryId);
      return null;
    }
  } catch (error) {
    console.error('获取协作日记失败:', error);
    return null;
  }
};
