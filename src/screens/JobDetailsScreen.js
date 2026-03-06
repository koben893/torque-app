import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, FlatList, useWindowDimensions, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function JobDetailsScreen({ 
  setCurrentScreen, selectedJob, setSelectedJob, savedJobs, setSavedJobs,
  setActiveVehicle, setJobParts // <-- Make sure these are added!
}) {
  const { width } = useWindowDimensions();

  // Modal states for renaming the whole job
  const [editTitleModalVisible, setEditTitleModalVisible] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');

  // Modal states for renaming specific parts
  const [editPartModalVisible, setEditPartModalVisible] = useState(false);
  const [editingPartId, setEditingPartId] = useState(null);
  const [editingPartName, setEditingPartName] = useState('');

  // --- GLOBAL DATABASE UPDATER ---
  // This helper function syncs changes to both our current view AND the global archive
  const syncJobUpdate = (updatedJob) => {
    setSelectedJob(updatedJob);
    setSavedJobs(prevJobs => prevJobs.map(job => job.id === updatedJob.id ? updatedJob : job));
  };

  // --- 1. DELETE ENTIRE JOB ---
  const handleDeleteJob = () => {
    Alert.alert("Delete Workspace?", "Are you sure you want to permanently delete this saved job? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: () => {
          // Filter it entirely out of the database
          setSavedJobs(prevJobs => prevJobs.filter(job => job.id !== selectedJob.id));
          setSelectedJob(null);
          setCurrentScreen('SavedJobsScreen'); // Kick them back to the archive
        } 
      }
    ]);
  };

  // --- 2. RENAME JOB TITLE ---
  const openTitleEdit = () => {
    setEditingTitle(selectedJob.title);
    setEditTitleModalVisible(true);
  };

  const saveTitleEdit = () => {
    const updatedJob = { ...selectedJob, title: editingTitle };
    syncJobUpdate(updatedJob);
    setEditTitleModalVisible(false);
  };

  // --- 3. RENAME A PART ---
  const openPartEdit = (part) => {
    setEditingPartId(part.id);
    setEditingPartName(part.partNumber);
    setEditPartModalVisible(true);
  };

  const savePartEdit = () => {
    const updatedParts = selectedJob.parts.map(part => 
      part.id === editingPartId ? { ...part, partNumber: editingPartName } : part
    );
    const updatedJob = { ...selectedJob, parts: updatedParts };
    syncJobUpdate(updatedJob);
    setEditPartModalVisible(false);
  };

  // --- 4. DELETE A PART ---
  const handleDeletePart = (partId) => {
    Alert.alert("Delete Part?", "Remove this part from the job record?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Remove", 
        style: "destructive", 
        onPress: () => {
          const updatedParts = selectedJob.parts.filter(part => part.id !== partId);
          const updatedJob = { ...selectedJob, parts: updatedParts };
          syncJobUpdate(updatedJob);
        } 
      }
    ]);
  };

  return (
    <View style={styles.jobContainer}>
      
      {/* HEADER WITH EDIT PENCIL */}
      <View style={styles.jobHeaderRow}>
         <TouchableOpacity style={styles.headerBackButton} onPress={() => setCurrentScreen('SavedJobsScreen')}>
           <Ionicons name="chevron-back" size={32} color="#fff" />
         </TouchableOpacity>
         
         <View style={{ alignItems: 'center', flex: 1 }}>
           <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={openTitleEdit}>
             <Text style={[styles.headerText, { fontSize: 20, marginRight: 8 }]} numberOfLines={1}>{selectedJob.title}</Text>
             <Ionicons name="pencil" size={16} color="#4da6ff" />
           </TouchableOpacity>
           <Text style={[styles.subText, { color: '#4da6ff', fontWeight: 'bold' }]}>{selectedJob.date} • {selectedJob.parts.length} Parts</Text>
         </View>
         
         <View style={{ width: 32 }} /> 
      </View>

      {/* GALLERY */}
      {selectedJob.parts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="hardware-chip-outline" size={80} color="#444" />
          <Text style={[styles.subText, { marginTop: 20 }]}>All parts were removed from this workspace.</Text>
        </View>
      ) : (
        <FlatList 
          data={selectedJob.parts}
          keyExtractor={(item) => item.id}
          horizontal={true}
          pagingEnabled={true} 
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={[styles.galleryCard, { width: width * 0.9, marginHorizontal: width * 0.05 }]}>
               {item.photo ? (
                 <Image source={{ uri: item.photo }} style={styles.galleryImage} resizeMode="cover" />
               ) : (
                 <View style={styles.noImagePlaceholder}><Text style={styles.subText}>No Photo</Text></View>
               )}
               <View style={styles.galleryInfoBox}>
                 <Text style={styles.galleryPartTitle}>Part {index + 1} of {selectedJob.parts.length}</Text>
                 
                 {/* THE PART ACTION ROW */}
                 <View style={styles.editableNameRow}>
                   <Text style={[styles.galleryPartNumber, { flex: 1, fontSize: item.partNumber.length > 15 ? 20 : 28 }]} numberOfLines={2}>
                     {item.partNumber}
                   </Text>
                   
                   <View style={{ flexDirection: 'row' }}>
                   {/* 1. Edit Pencil */}
                   <TouchableOpacity style={styles.actionButton} onPress={() => openPartEdit(item)}>
                     <Ionicons name="pencil" size={20} color="#4da6ff" />
                   </TouchableOpacity>
                   
                   {/* 2. NEW: Green Add Part Button! */}
                   <TouchableOpacity 
                     style={[styles.actionButton, { marginLeft: 10 }]} 
                     onPress={() => {
                       // Re-opens this saved job in the live camera!
                       setActiveVehicle({ name: selectedJob.title, vin: selectedJob.vin });
                       setJobParts(selectedJob.parts);
                       // Removes it from the archive temporarily while you edit it
                       setSavedJobs(prevJobs => prevJobs.filter(job => job.id !== selectedJob.id));
                       setCurrentScreen('CameraScreen');
                     }}
                   >
                     <Ionicons name="add" size={20} color="#5cb85c" />
                   </TouchableOpacity>

                   {/* 3. Delete Trash Can */}
                   <TouchableOpacity style={[styles.actionButton, { marginLeft: 10 }]} onPress={() => handleDeletePart(item.id)}>
                     <Ionicons name="trash" size={20} color="#ff4444" />
                   </TouchableOpacity>
                 </View>
                 </View>

               </View>
            </View>
          )}
        />
      )}

      {/* GLOBAL DELETE JOB BUTTON */}
      <TouchableOpacity style={styles.deleteJobButton} onPress={handleDeleteJob}>
        <Text style={styles.deleteJobText}>Delete Workspace</Text>
      </TouchableOpacity>

      {/* MODAL: EDIT JOB TITLE */}
      <Modal visible={editTitleModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Workspace</Text>
            <TextInput
              style={styles.modalInput}
              value={editingTitle}
              onChangeText={setEditingTitle}
              placeholder="Enter vehicle or ticket name..."
              placeholderTextColor="#666"
              autoFocus={true} 
              clearButtonMode="while-editing" 
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#333' }]} onPress={() => setEditTitleModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#4da6ff' }]} onPress={saveTitleEdit}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDIT PART NAME */}
      <Modal visible={editPartModalVisible} transparent={true} animationType="fade">
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
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#333' }]} onPress={() => setEditPartModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#4da6ff' }]} onPress={savePartEdit}>
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
  jobContainer: { flex: 1, backgroundColor: '#111', paddingTop: 60, paddingBottom: 40 },
  jobHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  headerBackButton: { padding: 5 },
  headerText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  subText: { color: '#aaa', fontSize: 16, marginTop: 5, textAlign: 'center' },
  
  galleryCard: { backgroundColor: '#222', borderRadius: 20, overflow: 'hidden', height: '80%' }, 
  galleryImage: { width: '100%', height: '70%' },
  noImagePlaceholder: { width: '100%', height: '70%', backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  
  galleryInfoBox: { padding: 20, justifyContent: 'center', alignItems: 'flex-start' }, 
  galleryPartTitle: { color: '#888', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  galleryPartNumber: { color: '#fff', fontWeight: 'bold', marginTop: 5 },
  
  editableNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 5 },
  actionButton: { padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15 },

  deleteJobButton: { marginTop: 10, paddingVertical: 15, alignItems: 'center' },
  deleteJobText: { color: '#ff4444', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#222', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 15 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: '#111', color: '#fff', fontSize: 18, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#444', marginBottom: 25 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});