import React, { useState, useCallback } from "react";
import { SafeAreaView, StyleSheet, Dimensions, View, ScrollView, RefreshControl } from "react-native";
import TopSection from "@/components/dayCounter";
import { Day } from "@/components/Day";
import Bluetooth from "@/components/BluetoothCard";
import StackedCards from "@/components/Dairycollect";
import Header from "@/components/Header";

export default function App() {
  const [refreshing, setRefreshing] = useState(false);
  
  const startDate = new Date("2024-04-20");
  const today = new Date();
  const daysSince = Math.floor((+today - +startDate) / (1000 * 60 * 60 * 24));

  const yearsPassed = Math.floor(daysSince / 365);
  const nextAnniversary = yearsPassed + 1;
  const nextAnniversaryDays = nextAnniversary * 365;
  const daysToNextAnniversary = nextAnniversaryDays - daysSince;

  const halfYearsPassed = Math.floor((daysSince - 182.5) / 365);
  const nextHalfAnniversary = halfYearsPassed + 1;
  const nextHalfAnniversaryDays = Math.round(nextHalfAnniversary * 365);
  const daysToNextHalfAnniversary = nextHalfAnniversaryDays - daysSince;

  // 处理屏幕宽度
  const screenWidth = Dimensions.get("window").width;
  const frameWidth = Math.min(screenWidth - 40, 400);

  // 下拉刷新处理
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // 模拟刷新操作
    setTimeout(() => {
      console.log("页面已刷新");
      // 这里可以添加刷新数据的逻辑：
      // - 重新获取蓝牙连接状态
      // - 刷新日记数据
      // - 更新纪念日计算
      // - 重新加载其他数据
      
      setRefreshing(false);
    }, 1500); // 1.5秒后完成刷新
  }, []);

  // 蓝牙配对成功回调
  const handleBluetoothPairingSuccess = () => {
    console.log("ペアリングが成功しました。日記機能が解除されました");
  };

  const handleAvatarPress = () => {
    console.log("头像被点击");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header 固定在顶部，不参与滚动 */}
      <Header 
        logoUri="https://placehold.co/40x40?text=Logo"
        avatarUri="https://placehold.co/40x40?text=Me"
        onAvatarPress={handleAvatarPress}
      />
      
      {/* 可下拉刷新的滚动内容 */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF84A7" // iOS 下拉图标颜色
            colors={["#FF84A7", "#F6C9CC"]} // Android 下拉图标颜色
            progressBackgroundColor="#FDF6F4" // Android 背景色
            title="下拉刷新..." // iOS 刷新文字
            titleColor="#FF84A7" // iOS 文字颜色
          />
        }
      >
        {/* Day 组件 */}
        <View style={styles.section}>
          <Day />
        </View>
        
        {/* Bluetooth 组件 */}
        <View style={styles.bluetoothContainer}>
          <Bluetooth
            onPairingSuccess={handleBluetoothPairingSuccess}
            isEnabled={true}
          />
        </View>
        
        {/* StackedCards 组件 */}
        <View style={styles.section}>
          <StackedCards frameWidth={frameWidth} />
        </View>
        
        {/* TopSection 组件 */}
        <View style={styles.section}>
          <TopSection
            daysSince={daysSince}
            nextAnniversary={nextAnniversary}
            daysToNextAnniversary={daysToNextAnniversary}
            nextHalfAnniversary={nextHalfAnniversary}
            daysToNextHalfAnniversary={daysToNextHalfAnniversary}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDF6F4",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 80, // 给底部 Tab 栏留空间
  },
  section: {
    marginBottom: 16,
    width: '100%',
  },
  bluetoothContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
});
