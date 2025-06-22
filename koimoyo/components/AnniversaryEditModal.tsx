import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface AnniversaryEditModalProps {
  visible: boolean;
  title: string;
  date: string;
  onTitleChange: (title: string) => void;
  onDateChange: (date: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const AnniversaryEditModal: React.FC<AnniversaryEditModalProps> = ({
  visible,
  title,
  date,
  onTitleChange,
  onDateChange,
  onSave,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onCancel}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>編集</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>タイトル</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={onTitleChange}
              placeholder="タイトルを入力"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>日付</Text>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={onDateChange}
              placeholder="YY/MM/DD"
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FDF6F4",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#A47D7D",
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#B08585",
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#FAD4D0",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFF",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#E8E8E8",
    marginRight: 10,
  },
  cancelButtonText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FAD4D0",
    marginLeft: 10,
  },
  saveButtonText: {
    textAlign: "center",
    color: "#A47D7D",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AnniversaryEditModal;