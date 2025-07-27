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
  Dimensions,
  Platform,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上にしてください');
      return;
    }

    setIsLoading(true);

    try {
      // Firebase Auth 用户创建
      await createUserWithEmailAndPassword(auth, email, password);
      
      // 注册成功后跳转到个人信息设置页面
      router.push(`/profile-setup?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      console.error('Registration error:', error);
      let message = '登録に失敗しました';
      if (error.code === 'auth/email-already-in-use') {
        message = 'このメールアドレスはすでに使われています';
      } else if (error.code === 'auth/invalid-email') {
        message = 'メールアドレスが正しくありません';
      } else if (error.code === 'auth/weak-password') {
        message = 'パスワードは6文字以上にしてください';
      }
      Alert.alert('エラー', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* 背景装饰元素 */}
        <View style={styles.backgroundDecoration}>
          <View style={styles.gradientCircle1} />
          <View style={styles.gradientCircle2} />
          <View style={styles.gradientCircle3} />
        </View>

        {/* 顶部Logo区域 */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/avatar.png')} 
              style={styles.logo}
            />
          </View>
          <Text style={styles.title}>アカウント作成</Text>
          <Text style={styles.subtitle}>こいもようへようこそ</Text>
        </View>

        {/* 注册表单区域 */}
        <View style={styles.formSection}>
          {/* 邮箱输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>メールアドレス</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#8BB6DB" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="メールアドレスを入力してください"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A0AEC0"
              />
            </View>
          </View>

          {/* 密码输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>パスワード</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#8BB6DB" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="パスワード（6文字以上）"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#A0AEC0"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye" : "eye-off"} 
                  size={20} 
                  color="#8BB6DB" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 注册按钮 */}
          <TouchableOpacity 
            style={[styles.registerButton, isLoading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? '登録中...' : 'アカウント作成'}
            </Text>
          </TouchableOpacity>

          {/* 登录链接 */}
          <View style={styles.loginSection}>
            <Text style={styles.loginPrompt}>すでにアカウントをお持ちの方</Text>
            <TouchableOpacity 
              onPress={() => router.push('/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>ログイン</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  gradientCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(247, 168, 184, 0.3)',
    opacity: 0.6,
  },
  gradientCircle2: {
    position: 'absolute',
    top: 150,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(139, 182, 219, 0.4)',
    opacity: 0.5,
  },
  gradientCircle3: {
    position: 'absolute',
    bottom: 100,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(247, 168, 184, 0.2)',
    opacity: 0.4,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 80,
    paddingBottom: 40,
    zIndex: 1,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: 'rgba(139, 182, 219, 0.3)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#8BB6DB',
    fontWeight: '500',
    opacity: 0.8,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    zIndex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 182, 219, 0.2)',
    shadowColor: 'rgba(139, 182, 219, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    paddingVertical: 16,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  registerButton: {
    backgroundColor: '#F7A8B8',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    shadowColor: '#F7A8B8',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0.1,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loginSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  loginPrompt: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
  },
  loginLinkText: {
    fontSize: 16,
    color: '#8BB6DB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
