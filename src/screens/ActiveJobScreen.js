import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Image, FlatList, Modal, TextInput, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ActiveJobScreen({ 
  setCurrentScreen, 
  activeVehicle, 
  setActiveVehicle, 
  jobParts, 
  setJobParts, 
  savedJobs, 
  setSavedJobs 
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPartId, setEditingPartId] = useState(null);
  const [editingPartName, setEditingPartName] = useState('');

  // --- DELETE INDIVIDUAL PART ---
  const handleDeletePart = (partId) => {
    Alert.alert("Delete Part?", "Remove this photo from your active workspace?", [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => { 
            setJobParts(prevParts => prevParts.filter(part => part.id !== partId)); 
          } 
        }
      ]
    );
  };

  const handleSaveJob = () => {
    if (jobParts.length === 0 && !activeVehicle) {
      Alert.alert("Empty Job", "Scan a vehicle or some parts before saving!");
      return;
    }
    const newSavedJob = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      title: activeVehicle ? activeVehicle.name : `Repair Ticket #${savedJobs.length + 1}`,
      vin: activeVehicle ? activeVehicle.vin : "No VIN scanned",
      parts: jobParts 
    };
    setSavedJobs(prevJobs => [...prevJobs, newSavedJob]);
    setJobParts([]); 
    setActiveVehicle(null);
    Alert.alert("Success!", "Job saved to vehicle history.");
    setCurrentScreen('CameraScreen');
  };

  const openEditModal = (item) => {
    setEditingPartId(item.id);
    setEditingPartName(item.partNumber);
    setEditModalVisible(true);
  };

  const saveEditedName = () => {
    setJobParts(prevParts => prevParts.map(part => 
      part.id === editingPartId ? { ...part, partNumber: editingPartName } : part
    ));
    setEditModalVisible(false);
  };

  return (
    <View style={[styles.jobContainer, { paddingTop: Math.max(insets.top + 10, 20), paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
      <View style={styles.jobHeaderRow}>
         <TouchableOpacity style={styles.headerBackButton} onPress={() => setCurrentScreen('CameraScreen')}>
           <Ionicons name="chevron-back" size={32} color="#fff" />
         </TouchableOpacity>
         <View style={{ alignItems: 'center' }}>
           <Text style={styles.headerText}>{activeVehicle ? "Active Workspace" : "Active Job"}</Text>
           <Text style={[styles.subText, activeVehicle && { color: '#4da6ff', fontWeight: 'bold' }]}>
             {activeVehicle ? activeVehicle.name : `${jobParts.length} Part(s) Scanned`}
           </Text>
         </View>
         <View style={{ width: 32 }} /> 
      </View>

      {/* Wrapping the FlatList in a flex: 1 View prevents squishing! */}
      <View style={{ flex: 1 }}>
        {jobParts.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
             <Ionicons name="hardware-chip-outline" size={80} color="#444" />
             <Text style={[styles.subText, { marginTop: 20 }]}>No parts added yet.</Text>
          </View>
        ) : (
          <FlatList 
            data={jobParts}
            keyExtractor={(item) => item.id}
            horizontal={true}
            pagingEnabled={true} 
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.galleryCard, { width: width * 0.9, marginHorizontal: width * 0.05 }]}>
                 {item.photo ? (
                   <Image source={{ uri: item.photo }} style={styles.galleryImage} resizeMode="cover" />
                 ) : (
                   <View style={styles.noImagePlaceholder}><Text style={styles.subText}>No Photo</Text></View>
                 )}
                 <View style={styles.galleryInfoBox}>
                   <Text style={styles.galleryPartTitle}>Part Name / Number</Text>
                   
                   <View style={styles.editableNameRow}>
                      <TouchableOpacity 
                        style={{ flex: 1 }} 
                        onPress={() => openEditModal(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.galleryPartNumber, { fontSize: item.partNumber.length > 15 ? 20 : 28 }]} numberOfLines={2}>
                          {item.partNumber}
                        </Text>
                      </TouchableOpacity>
                     
                     <View style={{ flexDirection: 'row' }}>
                       <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
                         <Ionicons name="pencil" size={20} color="#4da6ff" />
                       </TouchableOpacity>
                       
                       <TouchableOpacity 
                         style={[styles.editButton, { marginLeft: 10, flexDirection: 'row', alignItems: 'center' }]} 
                         onPress={() => handleDeletePart(item.id)}
                       >
                         <Ionicons name="trash" size={18} color="#ff4444" />
                         <Text style={{ color: '#ff4444', fontWeight: 'bold', marginLeft: 5 }}>Delete</Text>
                       </TouchableOpacity>
                     </View>
                   </View>
                   
                 </View>
              </View>
            )}
          />
        )}
      </View>

      {/* --- UNIFORM BUTTON LAYOUT --- */}
      <View style={styles.buttonWrapper}>
        <View style={styles.jobActionRow}>
          <TouchableOpacity 
            style={[styles.uniformButton, { backgroundColor: '#5cb85c', marginRight: 10 }]} 
            onPress={() => setCurrentScreen('CameraScreen')}
          >
            <Text style={styles.buttonText}>+ Add Part</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.uniformButton, { backgroundColor: '#4da6ff', marginLeft: 10 }]} 
            onPress={handleSaveJob}
          >
            <Text style={styles.buttonText}>Save Job</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={editModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Part</Text>
            <TextInput
              style={styles.modalInput}
              value={editingPartName}
              onChangeText={setEditingPartName}
              placeholder="Enter custom part name..."
              placeholderTextColor="#666"
              autoFocus={true} 
              clearButtonMode="while-editing" 
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#333' }]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#4da6ff' }]} onPress={saveEditedName}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  jobContainer: { flex: 1, backgroundColor: '#111' },
  jobHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  headerBackButton: { padding: 5 },
  headerText: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subText: { color: '#aaa', fontSize: 16, marginTop: 5, textAlign: 'center' },
  
  galleryCard: { backgroundColor: '#222', borderRadius: 20, overflow: 'hidden', flex: 1, marginBottom: 20 }, 
  galleryImage: { width: '100%', height: '70%' },
  noImagePlaceholder: { width: '100%', height: '70%', backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  galleryInfoBox: { padding: 20, justifyContent: 'center', alignItems: 'flex-start' }, 
  galleryPartTitle: { color: '#888', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  galleryPartNumber: { color: '#fff', fontWeight: 'bold', marginTop: 5 },
  editableNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 5 },
  editButton: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15 },
  
  buttonWrapper: { alignItems: 'center', paddingBottom: 10 },
  jobActionRow: { flexDirection: 'row', paddingHorizontal: 20, width: '100%' },
  uniformButton: { flex: 1, paddingVertical: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#222', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 15 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: '#111', color: '#fff', fontSize: 18, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#444', marginBottom: 25 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 }
});