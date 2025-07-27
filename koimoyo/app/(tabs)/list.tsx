import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { db, auth } from '../../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import NotificationToast from '../../components/NotificationToast';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any;
  createdBy: string;
  partnerUid?: string;
  firebaseId?: string;
}

const SWIPE_THRESHOLD = 120;
const DELETE_BUTTON_WIDTH = 80;

const SwipeableRow: React.FC<{
  todo: TodoItem;
  onToggle: () => void;
  onDelete: () => void;
  currentUser: string;
}> = ({ todo, onToggle, onDelete, currentUser }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        translateX.setValue(Math.max(gestureState.dx, -DELETE_BUTTON_WIDTH));
      } else if (isSwipeActive) {
        translateX.setValue(Math.min(gestureState.dx, 0));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -SWIPE_THRESHOLD) {
        // 滑动距离足够，显示删除按钮
        Animated.spring(translateX, {
          toValue: -DELETE_BUTTON_WIDTH,
          useNativeDriver: false,
        }).start();
        setIsSwipeActive(true);
      } else {
        // 滑动距离不够，回弹
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
        setIsSwipeActive(false);
      }
    },
  });

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
    setIsSwipeActive(false);
  };

  return (
    <View style={styles.swipeContainer}>
      {/* 删除按钮背景 */}
      <View style={styles.deleteBackground}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      </View>

      {/* 主要内容 */}
      <Animated.View
        style={[
          styles.todoItemAnimated,
          {
            transform: [{ translateX }],
          }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.todoItemContainer}>
          <TouchableOpacity
            style={[
              styles.todoItem,
              todo.completed && styles.completedTodoItem
            ]}
            onPress={() => {
              if (isSwipeActive) {
                resetSwipe();
              } else {
                onToggle();
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.todoContent}>
              <View style={styles.checkboxContainer}>
                <LinearGradient
                  colors={todo.completed ? ['#F7A8B8', '#8BB6DB'] : ['transparent', 'transparent']}
                  style={[
                    styles.checkbox,
                    !todo.completed && styles.uncheckedBox
                  ]}
                >
                  {todo.completed && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </LinearGradient>
              </View>
              
              <View style={styles.todoTextContainer}>
                <Text style={[
                  styles.todoText,
                  todo.completed && styles.completedTodoText
                ]}>
                  {todo.text}
                </Text>
                
                {/* 作成者情報 */}
                <Text style={styles.createdByText}>
                  {todo.createdBy === currentUser ? '自分が追加' : 'パートナーが追加'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const ListPage = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'info'
  });

  // 显示通知
  const showNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setNotification({
      visible: true,
      message,
      type
    });
  };

  // 获取当前用户和伴侣信息
  useEffect(() => {
    const getCurrentUser = async () => {
      const user = auth.currentUser;
      if (user) {
        setCurrentUser(user);
        
        // 获取用户信息和伴侣信息
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.partnerUid) {
              const partnerDoc = await getDoc(doc(db, 'users', userData.partnerUid));
              if (partnerDoc.exists()) {
                setPartnerInfo({ uid: userData.partnerUid, ...partnerDoc.data() });
              }
            }
          }
        } catch (error) {
          console.error('ユーザー情報の取得に失敗しました:', error);
        }
      }
    };
    getCurrentUser();
  }, []);

  // リアルタイムでTODOリストを監視（简化查询）
  useEffect(() => {
    if (!currentUser) return;

    const todosRef = collection(db, 'shared_todos');
    const q = query(
      todosRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData: TodoItem[] = [];
      snapshot.forEach((doc) => {
        todosData.push({
          id: doc.id,
          firebaseId: doc.id,
          ...doc.data()
        } as TodoItem);
      });
      // 在客户端按创建时间排序
      todosData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      setTodos(todosData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 监听实时通知（简化查询）
  useEffect(() => {
    if (!currentUser) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const notificationData = change.doc.data();
          
          // 只处理TODO相关的通知
          if (['todo_added', 'todo_updated', 'todo_deleted'].includes(notificationData.type)) {
            // 显示通知
            showNotification(notificationData.message, 'info');
            
            // 标记为已读
            await updateDoc(doc(db, 'notifications', change.doc.id), {
              read: true
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addTodo = async () => {
    if (!newTodo.trim() || !currentUser) return;

    try {
      const participants = partnerInfo ? [currentUser.uid, partnerInfo.uid] : [currentUser.uid];
      
      const todoData = {
        text: newTodo.trim(),
        completed: false,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        participants: participants,
        partnerUid: partnerInfo?.uid || null
      };

      await addDoc(collection(db, 'shared_todos'), todoData);

      // 伴侣に通知を送信
      if (partnerInfo) {
        await addDoc(collection(db, 'notifications'), {
          userId: partnerInfo.uid,
          message: `パートナーが新しいTODOを追加しました：「${newTodo.trim()}」`,
          type: 'todo_added',
          createdAt: serverTimestamp(),
          read: false
        });
      }

      setNewTodo('');
      setIsAddingTodo(false);
      
      showNotification(
        partnerInfo 
          ? 'TODOが追加され、パートナーに通知が送信されました。'
          : 'TODOが追加されました。',
        'success'
      );
    } catch (error) {
      console.error('TODO追加エラー:', error);
      Alert.alert('エラー', 'TODOの追加に失敗しました。');
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const todoRef = doc(db, 'shared_todos', id);
      const todoDoc = await getDoc(todoRef);
      
      if (todoDoc.exists()) {
        const currentCompleted = todoDoc.data().completed;
        await updateDoc(todoRef, {
          completed: !currentCompleted
        });

        // 伴侣に通知を送信
        if (partnerInfo) {
          const todoText = todoDoc.data().text;
          const message = !currentCompleted 
            ? `パートナーがTODOを完了しました：「${todoText}」`
            : `パートナーがTODOを未完了に戻しました：「${todoText}」`;
            
          await addDoc(collection(db, 'notifications'), {
            userId: partnerInfo.uid,
            message: message,
            type: 'todo_updated',
            createdAt: serverTimestamp(),
            read: false
          });
        }
        
        // 成功通知を表示
        const message = !currentCompleted 
          ? 'TODOを完了しました！'
          : 'TODOを未完了に戻しました。';
        showNotification(message, 'success');
      }
    } catch (error) {
      console.error('TODO更新エラー:', error);
      Alert.alert('エラー', 'TODOの更新に失敗しました。');
    }
  };

  const deleteTodo = async (id: string, todoText: string) => {
    Alert.alert(
      'TODOを削除',
      'このTODOを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'shared_todos', id));
              
              // 伴侣に通知を送信
              if (partnerInfo) {
                await addDoc(collection(db, 'notifications'), {
                  userId: partnerInfo.uid,
                  message: `パートナーがTODOを削除しました：「${todoText}」`,
                  type: 'todo_deleted',
                  createdAt: serverTimestamp(),
                  read: false
                });
              }
              
              showNotification('TODOを削除しました。', 'info');
            } catch (error) {
              console.error('TODO削除エラー:', error);
              Alert.alert('エラー', 'TODOの削除に失敗しました。');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#FFE8E8', '#FFF5F5']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#F7A8B8" />
        <Text style={styles.loadingText}>TODOリストを読み込み中...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FFE8E8', '#FFF5F5']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* 通知组件 */}
        <NotificationToast
          visible={notification.visible}
          message={notification.message}
          type={notification.type}
          onHide={() => setNotification(prev => ({ ...prev, visible: false }))}
        />
        
        <View style={styles.container}>
          <View style={styles.container}>
            {/* ヘッダー */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>TODOリスト</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAddingTodo(true)}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* パートナー情報表示 */}
            {partnerInfo && (
              <View style={styles.partnerInfo}>
                <Ionicons name="people" size={16} color="#8BB6DB" />
                <Text style={styles.partnerText}>
                  {partnerInfo.displayName || 'パートナー'}と共有中
                </Text>
              </View>
            )}

            {/* 新しいTODO追加 */}
            {isAddingTodo && (
              <View style={styles.addTodoContainer}>
                <TextInput
                  style={styles.addTodoInput}
                  value={newTodo}
                  onChangeText={setNewTodo}
                  placeholder="新しいTODOを入力..."
                  placeholderTextColor="#F7A8B8"
                  autoFocus
                  onSubmitEditing={addTodo}
                />
                <View style={styles.addTodoButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsAddingTodo(false);
                      setNewTodo('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                  <LinearGradient
                    colors={['#F7A8B8', '#8BB6DB']}
                    style={styles.saveButton}
                  >
                    <TouchableOpacity
                      style={styles.saveButtonInner}
                      onPress={addTodo}
                    >
                      <Text style={styles.saveButtonText}>追加</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* TODOリスト */}
            <ScrollView 
              style={styles.todoList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.todoListContent}
            >
              {todos.map((todo) => (
                <SwipeableRow
                  key={todo.id}
                  todo={todo}
                  currentUser={currentUser?.uid || ''}
                  onToggle={() => toggleTodo(todo.id)}
                  onDelete={() => deleteTodo(todo.id, todo.text)}
                />
              ))}
              
              {todos.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="list-outline" size={40} color="#F7A8B8" />
                  <Text style={styles.emptyStateText}>TODOがありません</Text>
                  <Text style={styles.emptyStateSubText}>
                    右上の + ボタンから追加してください
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // 加载样式
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#F7A8B8',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  
  // 主要容器样式
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  
  // 头部样式
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F7A8B8',
    textShadowColor: 'rgba(247,168,184,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F7A8B8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F7A8B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // 伙伴信息样式
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247,168,184,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(247,168,184,0.3)',
  },
  partnerText: {
    marginLeft: 8,
    color: '#F7A8B8',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // 添加TODO样式
  addTodoContainer: {
    backgroundColor: 'rgba(247,168,184,0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(247,168,184,0.2)',
  },
  addTodoInput: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(247,168,184,0.3)',
  },
  addTodoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(247,168,184,0.3)',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#F7A8B8',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 15,
  },
  saveButtonInner: {
    padding: 16,
  },
  saveButtonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // TODO列表样式
  todoList: {
    flex: 1,
  },
  todoListContent: {
    paddingBottom: 20,
  },
  
  // 滑动相关样式
  swipeContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  todoItemAnimated: {
    backgroundColor: 'transparent',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // TODO项样式
  todoItemContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(247,168,184,0.2)',
    overflow: 'hidden',
  },
  todoItemBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  todoItem: {
    padding: 20,
    backgroundColor: 'transparent',
    shadowColor: '#F7A8B8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completedTodoItem: {
    opacity: 0.7,
  },
  todoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: 16,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2,
    borderColor: '#F7A8B8',
  },
  todoTextContainer: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    lineHeight: 22,
  },
  completedTodoText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  createdByText: {
    fontSize: 12,
    color: '#F7A8B8',
    marginTop: 4,
    fontWeight: '500',
  },
  
  // 空状态样式
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    paddingVertical: 40,
    backgroundColor: 'rgba(247,168,184,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(247,168,184,0.2)',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#F7A8B8',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#F7A8B8',
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default ListPage;