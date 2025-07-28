import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface NotificationToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  type?: 'info' | 'success' | 'warning' | 'error';
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  visible,
  onHide,
  type = 'info'
}) => {
  const [translateY] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // 显示动画
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // 3秒后自动隐藏
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'sparkles'; // 更友好的成功图标
      case 'warning':
        return 'alert-circle';
      case 'error':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#8B5CF6'; // 紫色 - 优雅的成功色
      case 'warning':
        return '#F59E0B'; // 琥珀色 - 温和的警告色
      case 'error':
        return '#F97316'; // 橙色 - 替代红色
      default:
        return '#06B6D4'; // 青色 - 现代感信息色
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(139, 92, 246, 0.1)'; // 紫色背景
      case 'warning':
        return 'rgba(245, 158, 11, 0.1)'; // 琥珀色背景
      case 'error':
        return 'rgba(249, 115, 22, 0.1)'; // 橙色背景
      default:
        return 'rgba(6, 182, 212, 0.1)'; // 青色背景
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }] }
      ]}
    >
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <View style={[styles.content, { backgroundColor: getBackgroundColor() }]}>
          <Ionicons 
            name={getIconName()} 
            size={24} 
            color={getIconColor()}
            style={styles.icon}
          />
          <Text style={[styles.message, { color: getIconColor() }]}>{message}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  blurContainer: {
    borderRadius: 20, // 更圆润的边角
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, // 更深的阴影
    shadowOpacity: 0.15, // 更柔和的阴影
    shadowRadius: 12,
    elevation: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18, // 更宽松的内边距
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  icon: {
    marginRight: 14, // 稍微增加图标间距
  },
  message: {
    flex: 1,
    fontSize: 15, // 稍微增大字体
    fontWeight: '600', // 更粗的字体
    lineHeight: 22,
  },
});

export default NotificationToast;
