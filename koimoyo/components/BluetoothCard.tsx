import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BluetoothCardProps {
  onPairingSuccess?: () => void;
  isEnabled?: boolean;
}

const BluetoothCard: React.FC<BluetoothCardProps> = ({
  onPairingSuccess,
  isEnabled = true
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastConnectDate, setLastConnectDate] = useState('25/05/01');
  const [connectCount, setConnectCount] = useState(34);
  const [daysSinceLastConnect, setDaysSinceLastConnect] = useState(6);

  const handleConnect = useCallback(() => {
    if (!isEnabled) {
      Alert.alert('提示', '需要完成前置任务才能解锁此功能');
      return;
    }

    setIsScanning(true);
    // 模拟蓝牙连接过程
    setTimeout(() => {
      setIsScanning(false);
      setConnectCount(prev => prev + 1);
      setLastConnectDate(new Date().toLocaleDateString());
      setDaysSinceLastConnect(0);
      onPairingSuccess?.();
    }, 2000);
  }, [isEnabled, onPairingSuccess]);

  return (
    <TouchableOpacity
      style={[styles.container, !isEnabled && styles.disabled]}
      onPress={handleConnect}
      disabled={isScanning || !isEnabled}
    >
      <View style={styles.content}>
        <Text style={styles.title}>相手と一緒に連携しよう～</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.subtitle}>
            前回の日記から：{daysSinceLastConnect}日前
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={isScanning ? "bluetooth" : "bluetooth-outline"} 
                size={28} 
                color={isEnabled ? '#007AFF' : '#ccc'} 
              />
              {isScanning && (
                <ActivityIndicator 
                  style={styles.loader} 
                  color="#007AFF"
                  size="small"
                />
              )}
            </View>
            <Text style={styles.connectCount}>
              {connectCount}回 連携した
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  disabled: {
    opacity: 0.7,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  connectCount: {
    fontSize: 16,
    color: '#666',
  },
});

export default BluetoothCard;