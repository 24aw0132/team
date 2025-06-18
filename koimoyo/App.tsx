// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Day } from '@/components/Day';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import BottomNav from '@/components/bottomNav';


export type RootStackParamList = {
  Home: undefined;
  Calendar: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Day} options={{ title: 'ホーム' }} />
        
      </Stack.Navigator>
      <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: { 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            backgroundColor: '#FFFFFF' 
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "ホーム",
          headerShown: false 
        }} 
      />
      <Tabs.Screen 
        name="calendar" 
        options={{ 
          title: "カレンダー" 
        }} 
      />
      <Tabs.Screen 
        name="star" 
        options={{ 
          title: "お気に入り" 
        }} 
      />
      <Tabs.Screen 
        name="list" 
        options={{ 
          title: "リスト" 
        }} 
      />
    </Tabs>
    </NavigationContainer>
  );
}
