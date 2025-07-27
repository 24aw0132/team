import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// 生成6位用户ID（前3位英文，后3位数字）
const generateUserId = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let result = '';
  // 前3位英文
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  // 后3位数字
  for (let i = 0; i < 3; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return result;
};

// 检查用户ID是否已存在
const checkUserIdExists = async (userId: string): Promise<boolean> => {
  try {
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking userId:', error);
    return false;
  }
};

// 生成唯一的用户ID
const generateUniqueUserId = async (): Promise<string> => {
  let userId = generateUserId();
  let attempts = 0;
  const maxAttempts = 10;
  
  while (await checkUserIdExists(userId) && attempts < maxAttempts) {
    userId = generateUserId();
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique user ID');
  }
  
  return userId;
};

export default function ProfileSetup() {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [hobby, setHobby] = useState('');
  const [birthday, setBirthday] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const params = useLocalSearchParams();
  const { email } = params;

  const handleComplete = async () => {
    if (!nickname.trim()) {
      Alert.alert('エラー', 'ニックネームを入力してください');
      return;
    }

    if (!gender) {
      Alert.alert('エラー', '性別を選択してください');
      return;
    }

    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('エラー', 'ユーザー情報が見つかりません');
        return;
      }

      // 生成唯一的6位用户ID
      const userId = await generateUniqueUserId();

      // 完整的用户数据结构
      const userData = {
        authUid: user.uid,           // Firebase Auth UID
        userId: userId,              // 6位用户ID（BBW586格式）
        email: email as string,
        nickname: nickname.trim(),
        gender: gender,
        hobby: hobby.trim() || '',   // 爱好可选
        birthday: birthday.toISOString().split('T')[0], // YYYY-MM-DD 格式
        avatarUrl: '',               // 默认为空，后续可上传
        backgroundUrl: '',           // 默认为空，后续可上传
        partnerId: '',               // 默认为空，后续配对时设置
        createdAt: new Date(),       // 创建时间
      };

      // 保存到 Firestore users 集合
      await setDoc(doc(db, 'users', user.uid), userData);

      Alert.alert(
        '登録完了！', 
        `あなたのユーザーIDは: ${userId}\n\nこいもようへようこそ！`,
        [
          {
            text: 'はじめる',
            onPress: () => router.replace('/') // 跳转到首页
          }
        ]
      );
    } catch (error: any) {
      console.error('Profile setup error:', error);
      let message = 'プロフィール設定に失敗しました';
      if (error.message === 'Failed to generate unique user ID') {
        message = 'ユーザーIDの生成に失敗しました。もう一度お試しください';
      }
      Alert.alert('エラー', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 头部装饰 */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image 
            source={require('../assets/avatar.png')} 
            style={styles.avatar}
          />
          <View style={styles.editIcon}>
            <Ionicons name="camera" size={16} color="#8BB6DB" />
          </View>
        </View>
        <Text style={styles.title}>プロフィールを設定しましょう！</Text>
      </View>

      {/* 昵称输入 */}
      <View style={styles.section}>
        <Text style={styles.label}>ニックネーム</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="お名前を入力してください"
          maxLength={20}
        />
      </View>

      {/* 性别选择 */}
      <View style={styles.section}>
        <Text style={styles.label}>性別（登録後は変更できません）</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === 'male' && styles.genderButtonSelected
            ]}
            onPress={() => setGender('male')}
          >
            <Ionicons 
              name="male" 
              size={24} 
              color={gender === 'male' ? '#fff' : '#8BB6DB'} 
            />
            <Text style={[
              styles.genderText,
              gender === 'male' && styles.genderTextSelected
            ]}>男性</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === 'female' && styles.genderButtonSelected
            ]}
            onPress={() => setGender('female')}
          >
            <Ionicons 
              name="female" 
              size={24} 
              color={gender === 'female' ? '#fff' : '#F7A8B8'} 
            />
            <Text style={[
              styles.genderText,
              gender === 'female' && styles.genderTextSelected
            ]}>女性</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 生日选择 */}
      <View style={styles.section}>
        <Text style={styles.label}>誕生日</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {birthday.getFullYear()}年{birthday.getMonth() + 1}月{birthday.getDate()}日
          </Text>
          <Ionicons name="calendar" size={20} color="#8BB6DB" />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={birthday}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setBirthday(selectedDate);
              }
            }}
            maximumDate={new Date()}
            minimumDate={new Date(1950, 0, 1)}
          />
        )}
      </View>

      {/* 爱好输入 */}
      <View style={styles.section}>
        <Text style={styles.label}>趣味（任意）</Text>
        <TextInput
          style={styles.input}
          value={hobby}
          onChangeText={setHobby}
          placeholder="趣味を教えてください"
          maxLength={50}
        />
      </View>

      {/* 完成按钮 */}
      <TouchableOpacity 
        style={[styles.completeButton, isLoading && styles.buttonDisabled]} 
        onPress={handleComplete}
        disabled={isLoading}
      >
        <Text style={styles.completeButtonText}>
          {isLoading ? '設定中...' : '完了'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    flexGrow: 1,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#2D3748',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 100,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderButtonSelected: {
    backgroundColor: '#F7A8B8',
    borderColor: '#F7A8B8',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#718096',
  },
  genderTextSelected: {
    color: '#fff',
  },
  completeButton: {
    backgroundColor: '#8BB6DB',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#8BB6DB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
