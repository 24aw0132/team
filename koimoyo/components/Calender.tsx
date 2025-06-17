// app/components/Calendar.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Calendar() {
    return (
    <View style={styles.container}>
        <Text>📅 这是一个简单的日历组件</Text>
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
    padding: 20,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    alignItems: 'center',
    },
});
