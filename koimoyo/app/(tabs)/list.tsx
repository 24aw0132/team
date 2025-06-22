import React, { useState, useRef } from 'react';
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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const SWIPE_THRESHOLD = 120;
const DELETE_BUTTON_WIDTH = 80;

const SwipeableRow: React.FC<{
  todo: TodoItem;
  onToggle: () => void;
  onDelete: () => void;
}> = ({ todo, onToggle, onDelete }) => {
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
              <View style={[
                styles.checkbox,
                todo.completed && styles.checkedBox
              ]}>
                {todo.completed && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </View>
            
            <Text style={[
              styles.todoText,
              todo.completed && styles.completedTodoText
            ]}>
              {todo.text}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const ListPage = () => {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: 1, text: 'イルミネーションに行く！', completed: false, createdAt: new Date() },
    { id: 2, text: 'お家でパーティーする！', completed: true, createdAt: new Date() },
    { id: 3, text: '温泉旅行に行く', completed: true, createdAt: new Date() },
    { id: 4, text: '映画を一緒に見る', completed: false, createdAt: new Date() },
    { id: 5, text: 'カフェでまったりする', completed: true, createdAt: new Date() },
  ]);
  
  const [newTodo, setNewTodo] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([
        {
          id: Date.now(),
          text: newTodo.trim(),
          completed: false,
          createdAt: new Date()
        },
        ...todos
      ]);
      setNewTodo('');
      setIsAddingTodo(false);
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    Alert.alert(
      'TODOを削除',
      'このTODOを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => setTodos(todos.filter(todo => todo.id !== id))
        }
      ]
    );
  };

  const handleAvatarPress = () => {
    console.log("头像被点击");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header 
        logoUri="https://placehold.co/40x40?text=Logo"
        avatarUri="https://placehold.co/40x40?text=Me"
        onAvatarPress={handleAvatarPress}
      />
      
      <View style={styles.container}>
        {/* 标题和添加按钮 */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>TODOリスト</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddingTodo(true)}
          >
            <Ionicons name="add" size={24} color="#A47D7D" />
          </TouchableOpacity>
        </View>

        {/* 添加新TODO的输入框 */}
        {isAddingTodo && (
          <View style={styles.addTodoContainer}>
            <TextInput
              style={styles.addTodoInput}
              value={newTodo}
              onChangeText={setNewTodo}
              placeholder="新しいTODOを入力..."
              placeholderTextColor="#B08585"
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
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addTodo}
              >
                <Text style={styles.saveButtonText}>追加</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TODO列表 */}
        <ScrollView 
          style={styles.todoList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.todoListContent}
        >
          {todos.map((todo) => (
            <SwipeableRow
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo(todo.id)}
              onDelete={() => deleteTodo(todo.id)}
            />
          ))}
          
          {todos.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>TODOがありません</Text>
              <Text style={styles.emptyStateSubText}>右上の + ボタンから追加してください</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDF6F4",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A47D7D',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAD4D0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addTodoContainer: {
    backgroundColor: '#FAD4D0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  addTodoInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0C4C0',
  },
  addTodoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#E8E8E8',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#A47D7D',
  },
  saveButtonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
    borderRadius: 16,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  todoItem: {
    backgroundColor: '#FAD4D0',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  completedTodoItem: {
    backgroundColor: '#F0C4C0',
    opacity: 0.8,
  },
  todoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#B08585',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#A47D7D',
    borderColor: '#A47D7D',
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: '#A47D7D',
    fontWeight: '500',
  },
  completedTodoText: {
    textDecorationLine: 'line-through',
    color: '#B08585',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#B08585',
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#C4A4A4',
  },
});

export default ListPage;