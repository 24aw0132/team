import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Calendar() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>これはダミー画面です 🚧</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF6F4',
  },
  text: {
    fontSize: 18,
    color: '#B08585',
  },
});
