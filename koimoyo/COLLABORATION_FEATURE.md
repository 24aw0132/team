# 协作编辑功能说明

## 功能概述
实现了情侣日记协作编辑功能，允许一方邀请另一方共同编辑同一篇日记。

## 主要文件
1. `DiaryDetail.tsx` - 添加了邀请按钮和邀请发送逻辑
2. `NotificationBell.tsx` - 通知组件，显示协作邀请
3. `collaboration-edit.tsx` - 协作编辑页面
4. `collaboration-diary-view.tsx` - 双页面日记展示页面

## 功能流程

### 1. 发送邀请
- 在 `DiaryDetail.tsx` 页面底部添加"➕ 邀请另一半参与编辑"按钮
- 点击后创建邀请记录到 `collaboration_invites` 集合
- 邀请信息包含：日记ID、标题、邀请者信息、被邀请者ID等

### 2. 接收通知
- `NotificationBell` 组件监听当前用户的待处理邀请
- 在头像左边显示通知铃铛，有未读通知时显示红色标记
- 点击通知铃铛查看邀请详情

### 3. 协作编辑
- 接受邀请后进入 `collaboration-edit.tsx` 页面
- 邀请者可以编辑标题和位置（如果有）
- 被邀请者只能编辑内容和上传图片
- 使用 `collaboration_diaries` 集合存储协作数据

### 4. 双页面展示
- 双方都完成编辑后，创建最终的双页面日记
- 使用 `collaboration-diary-view.tsx` 展示
- 支持左右滑动查看不同用户的内容
- 粉色背景为女生内容，浅蓝色背景为男生内容

## 数据结构

### collaboration_invites 集合
```typescript
{
  id: string;
  diaryId: string;
  diaryTitle: string;
  inviterId: string;
  inviterNickname: string;
  inviteeId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: timestamp;
  type: 'diary_collaboration';
}
```

### collaboration_diaries 集合
```typescript
{
  id: string;
  title: string;
  location?: string;
  inviterContent?: string;
  inviterImages?: string[];
  collaboratorContent?: string;
  collaboratorImages?: string[];
  inviterId: string;
  collaboratorId: string;
  status: 'editing' | 'completed';
  createdAt: timestamp;
}
```

### final_collaboration_diaries 集合
```typescript
{
  title: string;
  location?: string;
  inviterContent: string;
  inviterImages: string[];
  collaboratorContent: string;
  collaboratorImages: string[];
  inviterId: string;
  collaboratorId: string;
  type: 'collaboration';
  createdAt: timestamp;
}
```

## 主要修复
1. 修复了 Firestore 查询复合索引问题
2. 解决了协作编辑文档保存失败的问题
3. 使用 `setDoc` 的 merge 选项确保文档存在性
4. 添加了详细的错误处理和调试日志

## 使用方法
1. 确保用户已配对（有 partnerId）
2. 在日记详情页点击邀请按钮
3. 另一半会收到通知
4. 接受邀请后进入协作编辑
5. 双方完成后可查看双页面日记

## 注意事项
- 需要 Firebase Firestore 数据库
- 需要 Cloudinary 图片上传服务
- 确保用户已正确配对
- 检查 Firestore 安全规则允许相关操作
