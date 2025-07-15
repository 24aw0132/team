import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface BluetoothCardProps {
  onPairingSuccess?: () => void;
  isEnabled?: boolean;
}

const BluetoothCard: React.FC<BluetoothCardProps> = ({
  onPairingSuccess,
  isEnabled = true
}) => {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [lastConnectDate, setLastConnectDate] = useState('25/05/01');
  const [connectCount, setConnectCount] = useState(34);
  const [daysSinceLastConnect, setDaysSinceLastConnect] = useState(6);

  const handleConnect = useCallback(() => {
    if (!isEnabled) {
      Alert.alert('注意', 'この機能を使うには事前のタスクを完了してください');
      return;
    }

    setIsScanning(true);
    // Bluetooth接続プロセスをシミュレート
    setTimeout(() => {
      setIsScanning(false);
      setConnectCount(prev => prev + 1);
      setLastConnectDate(new Date().toLocaleDateString());
      setDaysSinceLastConnect(0);
      onPairingSuccess?.();
    }, 2000);
  }, [isEnabled, onPairingSuccess]);

  const handlePress = () => {
    if (!isEnabled) return;
    router.push('/DiaryWriting');
  };

  

  return (
    <TouchableOpacity
      style={[styles.container, !isEnabled && styles.disabled]}
      onPress={handlePress}
      disabled={!isEnabled}
    >
      <View style={styles.content}>
        <Text style={styles.title}>連携しよう！</Text>
        <Ionicons name="bluetooth-outline" size={28} color="#007AFF" />
      </View>

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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
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
    opacity: 0.6,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    width: '100%',
    textAlign: 'center',
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
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
