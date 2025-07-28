// 测试协作日记工具函数的使用示例

import { 
  updateCollaborationDiary, 
  createOrUpdateCollaborationDiary, 
  getCollaborationDiary 
} from '../utils/collaborationDiary';

// 测试函数：更新协作日记
export const testUpdateCollaborationDiary = async () => {
  const testDiaryId = 'test-diary-2025-01-28';
  
  console.log('=== 测试开始：更新协作日记 ===');
  
  // 步骤1：创建或初始化协作日记
  console.log('步骤1：创建初始协作日记');
  const initSuccess = await createOrUpdateCollaborationDiary(testDiaryId, {
    title: '测试协作日记',
    inviterId: 'user123',
    inviterContent: '这是邀请者的初始内容',
    inviterImages: ['image1.jpg'],
    status: 'editing'
  });
  
  console.log('初始创建结果:', initSuccess);
  
  // 步骤2：协作者添加内容
  console.log('步骤2：协作者添加内容');
  const collaboratorSuccess = await updateCollaborationDiary(testDiaryId, {
    collaboratorContent: '这是协作者的内容',
    collaboratorImages: ['collab-image1.jpg', 'collab-image2.jpg'], // 这些会被追加
    collaboratorId: 'user456',
    status: 'editing'
  }, true); // 使用 arrayUnion
  
  console.log('协作者添加结果:', collaboratorSuccess);
  
  // 步骤3：邀请者追加更多图片
  console.log('步骤3：邀请者追加图片');
  const inviterUpdateSuccess = await updateCollaborationDiary(testDiaryId, {
    inviterImages: ['image2.jpg', 'image3.jpg'], // 追加到现有数组
  }, true); // 使用 arrayUnion
  
  console.log('邀请者更新结果:', inviterUpdateSuccess);
  
  // 步骤4：完成协作并更新状态
  console.log('步骤4：完成协作');
  const completeSuccess = await updateCollaborationDiary(testDiaryId, {
    status: 'completed'
  });
  
  console.log('完成协作结果:', completeSuccess);
  
  // 步骤5：读取最终结果
  console.log('步骤5：读取最终结果');
  const finalDiary = await getCollaborationDiary(testDiaryId);
  console.log('最终日记数据:', JSON.stringify(finalDiary, null, 2));
  
  console.log('=== 测试结束 ===');
  
  return finalDiary;
};

// 在 React Native 组件中使用的示例
export const useCollaborationDiaryUpdate = () => {
  const updateDiary = async (
    diaryId: string, 
    content: string, 
    images: string[], 
    isInviter: boolean, 
    userId: string
  ) => {
    try {
      const updateData: any = {};
      
      if (isInviter) {
        updateData.inviterContent = content;
        updateData.inviterImages = images;
        updateData.inviterId = userId;
      } else {
        updateData.collaboratorContent = content;
        updateData.collaboratorImages = images;
        updateData.collaboratorId = userId;
      }
      
      updateData.status = 'editing';
      
      // 使用 arrayUnion 追加图片
      const success = await updateCollaborationDiary(diaryId, updateData, true);
      
      if (success) {
        console.log('协作日记更新成功');
        return true;
      } else {
        console.log('协作日记更新失败');
        return false;
      }
    } catch (error) {
      console.error('更新协作日记时出错:', error);
      return false;
    }
  };
  
  return { updateDiary };
};
