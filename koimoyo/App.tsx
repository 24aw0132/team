// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Day } from './components/home/Day';
import { Calendar } from './components/home/Calendar';

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
        <Stack.Screen name="Calendar" component={Calendar} options={{ title: 'カレンダー' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
