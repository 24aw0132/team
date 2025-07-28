// 这是一个使用示例文件，展示如何使用协作日记工具函数

import { 
  updateCollaborationDiary, 
  createOrUpdateCollaborationDiary, 
  getCollaborationDiary 
} from '../utils/collaborationDiary';

// 示例1: 更新现有文档的协作者内容
export const exampleUpdateCollaboratorContent = async (diaryId: string) => {
  const success = await updateCollaborationDiary(diaryId, {
    collaboratorContent: '这是协作者添加的内容',
    collaboratorImages: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    status: 'editing'
  }, true); // 使用 arrayUnion 追加图片

  if (success) {
    console.log('协作者内容更新成功');
  } else {
    console.log('更新失败');
  }
};

// 示例2: 更新邀请者内容
export const exampleUpdateInviterContent = async (diaryId: string) => {
  const success = await updateCollaborationDiary(diaryId, {
    inviterContent: '这是邀请者的内容',
    inviterImages: ['https://example.com/inviter-image.jpg'],
    status: 'completed'
  }, true);

  return success;
};

// 示例3: 创建或更新文档（安全版本）
export const exampleCreateOrUpdate = async (diaryId: string, userId: string, isInviter: boolean) => {
  const updateData: any = {
    status: 'editing',
    title: '协作日记标题'
  };

  if (isInviter) {
    updateData.inviterContent = '邀请者的内容';
    updateData.inviterImages = ['image1.jpg', 'image2.jpg'];
    updateData.inviterId = userId;
  } else {
    updateData.collaboratorContent = '协作者的内容';
    updateData.collaboratorImages = ['image3.jpg'];
    updateData.collaboratorId = userId;
  }

  const success = await createOrUpdateCollaborationDiary(diaryId, updateData);
  return success;
};

// 示例4: 获取协作日记
export const exampleGetDiary = async (diaryId: string) => {
  const diary = await getCollaborationDiary(diaryId);
  if (diary) {
    console.log('协作日记数据:', diary);
    return diary;
  } else {
    console.log('文档不存在');
    return null;
  }
};

// 示例5: 使用 arrayUnion 追加新图片到现有数组
export const exampleAppendImages = async (diaryId: string, newImages: string[]) => {
  const success = await updateCollaborationDiary(diaryId, {
    collaboratorImages: newImages // 这些图片会被追加到现有数组中
  }, true); // 重要：设置为 true 使用 arrayUnion

  return success;
};
