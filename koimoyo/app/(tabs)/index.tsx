import { StyleSheet, View, Dimensions } from 'react-native';

import Calendar from '@/components/Calender';
import { ThemedView } from '@/components/ThemedView';
import StackedCards from '@/components/Dairycollect'; // 修改导入名称
import Bluetooth from '@/components/BluetoothCard'; // 假设有一个蓝牙卡片组件

export default function HomeScreen() {
  const screenWidth = Dimensions.get('window').width;
  const frameWidth = Math.min(screenWidth - 40, 400);

  const handleBluetoothPairingSuccess = () => {
    // 在这里添加解锁日记功能的逻辑
    console.log('ペアリングが成功しました。日記機能が解除されました');
  };

  return (
    <ThemedView style={styles.container}>
      <Calendar />
      <Bluetooth 
        onPairingSuccess={handleBluetoothPairingSuccess}
        isEnabled={true} // 这里可以根据实际条件控制是否启用
      />
      <View style={styles.centerBox}>
        <StackedCards frameWidth={frameWidth} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  centerBox: {
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
