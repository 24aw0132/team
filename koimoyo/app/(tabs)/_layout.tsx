import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import BottomNav from '@/components/bottomNav'; // あなたのカスタム BottomNav

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />} // tabBar を置き換える
      screenOptions={{
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="star" options={{ title: "Star" }} />
      <Tabs.Screen name="list" options={{ title: "List" }} />
    </Tabs>
  );
}
