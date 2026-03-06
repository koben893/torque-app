import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from 'react-native';

export default function ManualVinModal({ visible, onClose, onSubmit }) {
  const [vinInput, setVinInput] = useState('');

  const handleSubmit = () => {
    onSubmit(vinInput);
    setVinInput(''); // Clear it out for next time
  };

  const handleClose = () => {
    setVinInput('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Manual VIN Entry</Text>
          <TextInput
            style={styles.modalInput}
            value={vinInput}
            onChangeText={setVinInput}
            placeholder="Enter 17-character VIN..."
            placeholderTextColor="#666"
            autoCapitalize="characters"
            maxLength={17}
            autoFocus={true}
            clearButtonMode="while-editing"
          />
          <View style={styles.modalActionRow}>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#333' }]} onPress={handleClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#4da6ff' }]} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Search & Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#222', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 15 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: '#111', color: '#fff', fontSize: 18, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#444', marginBottom: 25, textAlign: 'center', letterSpacing: 2 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});