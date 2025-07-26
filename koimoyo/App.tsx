import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Calendar from './app/(tabs)/calendar';
import DiaryDetail from './app/diaryDetail';
import { TouchableOpacity, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export type RootStackParamList = {
  Calendar: undefined;
  DiaryDetail: {
    title: string;
    location: string;
    date: string;
    content: string;
    backgroundImage: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Calendar">
        <Stack.Screen name="Calendar" component={Calendar} />
        <Stack.Screen
          name="DiaryDetail"
          component={DiaryDetail}
          options={({ route, navigation }) => ({
            title: route.params.date,
            headerBackVisible: false, // ← デフォルトの戻るボタンを非表示
            headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#000',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#FFAABF',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.6,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 20 }}>{'<'}</Text>
                </View>
              </TouchableOpacity>
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
