import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

interface Wish {
  id: number;
  text: string;
  completed: boolean;
}

interface WishListProps {
  wishes: Wish[];
  onAdd: (wishText: string) => void;
  onToggle: (id: number) => void;
}

const WishList: React.FC<WishListProps> = ({ wishes, onAdd, onToggle }) => {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (input.trim()) {
      onAdd(input.trim());
      setInput('');
    }
  };

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="写下你的心愿..."
          style={styles.input}
        />
        <TouchableOpacity onPress={handleAdd} style={styles.button}>
          <Text style={styles.buttonText}>发布</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={wishes}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onToggle(item.id)}
            style={[
              styles.item,
              item.completed && styles.itemCompleted
            ]}
          >
            <View style={styles.checkbox}>
              {item.completed ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text
              style={[
                styles.itemText,
                item.completed && styles.itemTextCompleted
              ]}
            >
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4f8cff',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 10,
  },
  itemCompleted: {
    backgroundColor: '#e0e0e0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkmark: {
    fontSize: 16,
    color: '#4f8cff',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
});

export default WishList;