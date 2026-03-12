import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, ActivityIndicator, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchProductByBarcode } from '../utils/api'; 

export default function ManualPartModal({ visible, onClose, onAddPart, onInstantSearch }) {
  const [partInput, setPartInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async () => {
    Keyboard.dismiss(); 
    const query = partInput.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError('');

    const result = await fetchProductByBarcode(query);
    setIsSearching(false);

    if (result === query) {
      setSearchError("Not found in public barcode database. Use the button below to force add it.");
    } else {
      setSearchResult(result);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setPartInput('');
    setSearchResult(null);
    setSearchError('');
    onClose();
  };

  const handleAdd = () => {
    onAddPart(searchResult);
    handleClose(); 
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', alignItems: 'center' }}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Manual Part Search</Text>
                
                {!searchResult ? (
                  <>
                    <TextInput
                      style={styles.modalInput}
                      value={partInput}
                      onChangeText={(text) => { setPartInput(text); setSearchError(''); }}
                      placeholder="Enter part or serial #..."
                      placeholderTextColor="#666"
                      autoCapitalize="characters"
                      autoFocus={true}
                      clearButtonMode="while-editing"
                      onSubmitEditing={handleSearch} 
                    />

                    {searchError ? (
                      <View style={{ marginBottom: 20 }}>
                        <Text style={{color: '#ff4444', textAlign: 'center', marginBottom: 15, fontSize: 14}}>{searchError}</Text>
                        <TouchableOpacity 
                          style={{backgroundColor: '#444', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#666'}} 
                          onPress={() => {
                            Keyboard.dismiss();
                            setSearchResult(partInput);
                          }} 
                        >
                          <Text style={{color: '#fff', textAlign: 'center', fontWeight: 'bold'}}>Force Add as Custom Part</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    <View style={styles.modalActionRow}>
                      <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#333' }]} onPress={handleClose}>
                        <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalButton, { backgroundColor: isSearching ? '#777' : '#4da6ff' }]} 
                        onPress={handleSearch}
                        disabled={isSearching}
                      >
                        {isSearching ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Search</Text>}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.resultCard}>
                    <Ionicons name="construct-outline" size={40} color="#4da6ff" style={{marginBottom: 10}} />
                    <Text style={styles.resultCardTitle}>Part Identified</Text>
                    <Text style={styles.resultCardData}>{searchResult}</Text>
                    
                    <View style={[styles.modalActionRow, {marginTop: 25}]}>
                      <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#333' }]} onPress={() => setSearchResult(null)}>
                        <Text style={styles.buttonText}>Back</Text>
                      </TouchableOpacity>
                      
                      {/* NEW: Instant Search Button */}
                      <TouchableOpacity 
                        style={[styles.modalButton, { backgroundColor: '#ff8c00' }]} 
                        onPress={() => {
                          onInstantSearch(searchResult);
                          handleClose();
                        }}
                      >
                        <Text style={styles.buttonText}>Search</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#28a745' }]} onPress={handleAdd}>
                        <Text style={styles.buttonText}>Add Job</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#222', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 15 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: '#111', color: '#fff', fontSize: 18, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#444', marginBottom: 25, textAlign: 'center', letterSpacing: 2 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { flex: 1, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }, 
  resultCard: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#4da6ff', width: '100%' },
  resultCardTitle: { color: '#aaa', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  resultCardData: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' }
});