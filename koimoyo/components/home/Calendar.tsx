// components/home/Calendar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Calendar = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>これはカレンダー画面です📅</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  title: { fontSize: 20, fontWeight: 'bold' },
});
