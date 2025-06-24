import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

type Props = {
  startDate: string;
  label: string;
  days: number;
  onPress: () => void;
};

export default function Anniversarycount({ startDate, label, days, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.date}>{startDate}</Text>
      <Text style={styles.days}>{days}days</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fdd',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  label: { fontWeight: 'bold', fontSize: 16 },
  date: { fontSize: 14, marginVertical: 4 },
  days: { fontSize: 20, fontWeight: 'bold' },
});