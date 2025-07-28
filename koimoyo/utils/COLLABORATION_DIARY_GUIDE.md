# 协作日记工具函数使用指南

## 概述

这个工具包提供了三个主要的函数来处理 Firebase Firestore 中的协作日记文档：

1. `updateCollaborationDiary` - 更新现有文档
2. `createOrUpdateCollaborationDiary` - 创建或更新文档（安全版本）
3. `getCollaborationDiary` - 获取文档数据

## 导入

```typescript
import { 
  updateCollaborationDiary, 
  createOrUpdateCollaborationDiary, 
  getCollaborationDiary 
} from '../utils/collaborationDiary';
```

## 函数详解

### 1. updateCollaborationDiary

用于更新现有的协作日记文档。如果文档不存在，会返回 false。

```typescript
const success = await updateCollaborationDiary(
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
);
```

**参数说明：**
- `diaryId`: 协作日记的文档 ID
- `updates`: 要更新的字段对象
- `useArrayUnion`: 是否对图片数组使用 `arrayUnion()`（默认 false）

**使用示例：**

```typescript
// 基本更新
const success = await updateCollaborationDiary('diary123', {
  collaboratorContent: '协作者的内容',
  status: 'editing'
});

// 使用 arrayUnion 追加图片
const success = await updateCollaborationDiary('diary123', {
  collaboratorImages: ['new-image1.jpg', 'new-image2.jpg']
}, true); // 这些图片会被追加到现有数组中
```

### 2. createOrUpdateCollaborationDiary

安全的创建或更新函数。如果文档不存在会创建，如果存在会合并更新。

```typescript
const success = await createOrUpdateCollaborationDiary(
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
);
```

**使用示例：**

```typescript
// 创建新的协作日记
const success = await createOrUpdateCollaborationDiary('diary123', {
  title: '我们的协作日记',
  inviterId: 'user123',
  inviterContent: '邀请者的内容',
  status: 'editing'
});

// 更新现有日记
const success = await createOrUpdateCollaborationDiary('diary123', {
  collaboratorContent: '协作者的内容',
  collaboratorId: 'user456',
  status: 'completed'
});
```

### 3. getCollaborationDiary

获取协作日记文档数据。

```typescript
const diary = await getCollaborationDiary(diaryId: string);
```

**使用示例：**

```typescript
const diary = await getCollaborationDiary('diary123');
if (diary) {
  console.log('日记标题:', diary.title);
  console.log('邀请者内容:', diary.inviterContent);
  console.log('协作者内容:', diary.collaboratorContent);
} else {
  console.log('日记不存在');
}
```

## 实际使用场景

### 场景1：React Native 组件中保存协作内容

```typescript
const handleSave = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const updateData: any = {
    status: 'editing',
  };

  // 根据用户角色决定更新字段
  if (isInviter) {
    updateData.inviterContent = content;
    updateData.inviterImages = images;
    updateData.inviterId = currentUser.uid;
  } else {
    updateData.collaboratorContent = content;
    updateData.collaboratorImages = images;
    updateData.collaboratorId = currentUser.uid;
  }

  // 先检查文档是否存在
  const existingDoc = await getCollaborationDiary(diaryId);
  
  if (!existingDoc) {
    // 文档不存在，创建新文档
    updateData.title = diaryTitle;
    updateData.originalDiaryId = diaryId;
    updateData.inviterId = inviterId;
  }

  // 创建或更新文档
  const success = await createOrUpdateCollaborationDiary(diaryId, updateData);
  
  if (success) {
    Alert.alert('保存成功', '协作日记已保存！');
  } else {
    Alert.alert('保存失败', '请重试');
  }
};
```

### 场景2：追加图片到现有数组

```typescript
const addImages = async (diaryId: string, newImages: string[], isInviter: boolean) => {
  const updateData: any = {};
  
  if (isInviter) {
    updateData.inviterImages = newImages;
  } else {
    updateData.collaboratorImages = newImages;
  }
  
  // 使用 arrayUnion 追加图片，不会覆盖现有图片
  const success = await updateCollaborationDiary(diaryId, updateData, true);
  
  return success;
};
```

### 场景3：完成协作日记

```typescript
const completeDiary = async (diaryId: string) => {
  const success = await updateCollaborationDiary(diaryId, {
    status: 'completed'
  });
  
  if (success) {
    console.log('协作日记已完成');
  }
  
  return success;
};
```

## 错误处理

所有函数都包含了错误处理，会在控制台输出详细的错误信息：

```typescript
const success = await updateCollaborationDiary('diary123', data);
if (!success) {
  // 处理更新失败的情况
  console.log('更新失败，可能是文档不存在或网络问题');
}
```

## 数据结构

协作日记文档的完整结构：

```typescript
interface CollaborationDiary {
  id: string;
  title: string;
  originalDiaryId?: string;
  inviterId: string;
  collaboratorId?: string;
  inviterContent?: string;
  collaboratorContent?: string;
  inviterImages?: string[];
  collaboratorImages?: string[];
  status: 'editing' | 'completed';
  createdAt?: any;
  updatedAt: any; // 自动更新的时间戳
}
```

## 注意事项

1. **arrayUnion 的使用**：当 `useArrayUnion` 为 `true` 时，图片会被追加到现有数组中，而不是替换整个数组。

2. **时间戳**：所有更新操作都会自动添加 `updatedAt: serverTimestamp()` 字段。

3. **文档存在性检查**：`updateCollaborationDiary` 会检查文档是否存在，如果不存在会返回 false。

4. **安全性**：`createOrUpdateCollaborationDiary` 使用 `setDoc` 的 merge 选项，更加安全可靠。

5. **错误日志**：所有函数都包含详细的控制台日志，便于调试。
