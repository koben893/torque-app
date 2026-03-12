import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import our new Utilities and Components!
import { fetchRealVehicleData, fetchProductByBarcode, hashVIN } from '../utils/api';
import ManualVinModal from '../components/ManualVinModal';
import ManualPartModal from '../components/ManualPartModal';

const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;

export default function CameraScreen({ 
  setCurrentScreen, setScannedData, setCapturedPhoto, 
  activeVehicle, setActiveVehicle, jobParts, setJobParts, 
  savedJobs, setSavedJobs 
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null); 
  const isProcessing = useRef(false); 

  // We only need two simple visibility states now!
  const [manualVinVisible, setManualVinVisible] = useState(false);
  const [manualPartVisible, setManualPartVisible] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need your camera to scan parts!</Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleClearMemory = async () => {
    try {
      // Grab every single key saved on the phone's hard drive
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter out ONLY the ones that start with our AI cache tag
      const cacheKeys = allKeys.filter(key => key.startsWith('@ai_cache_'));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        Alert.alert("Memory Cleared", "All cached AI searches have been wiped. You are starting fresh!");
      } else {
        Alert.alert("Memory Clean", "No cached searches found.");
      }
    } catch (error) {
      console.log("Error clearing cache:", error);
      Alert.alert("Error", "Could not clear the memory.");
    }
  };

  // --- COMPONENT HANDLERS ---
  const handleManualVinSubmit = async (vinInput) => {
    if (!vinRegex.test(vinInput)) {
      Alert.alert("Invalid VIN", "Please enter a valid 17-character alphanumeric VIN.");
      return;
    }
    setManualVinVisible(false); 
    isProcessing.current = true;

    const truckName = await fetchRealVehicleData(vinInput);
    const secureHash = await hashVIN(vinInput); 

    if (activeVehicle) {
        Alert.alert("Replace Vehicle?", `Current: ${activeVehicle.name}\n\nDo you want to replace it with:\n${truckName}\nID: ${secureHash}?`, [
            { text: "Keep Current", style: "cancel", onPress: () => { isProcessing.current = false; } },
            { text: "Replace", style: "destructive", onPress: () => { setActiveVehicle({ name: truckName, vin: secureHash }); isProcessing.current = false; } }
          ]
        );
    } else {
        setActiveVehicle({ name: truckName, vin: secureHash });
        isProcessing.current = false;
    }
  };

  const handleAddManualPartToJob = (partName) => {
    setJobParts(prevParts => [...prevParts, { 
      partNumber: partName, 
      photo: null, 
      id: Date.now().toString() 
    }]);
    setCurrentScreen('ActiveJobScreen');
  };

  // --- CAMERA HANDLERS ---
  const handleBarcodeScanned = async ({ data }) => {
     if (isProcessing.current || manualVinVisible || manualPartVisible) return; 
     isProcessing.current = true; 

     let tempPhotoData = null;
     if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.1, base64: true });
          tempPhotoData = `data:image/jpeg;base64,${photo.base64}`;
        } catch (error) {
          console.log("Camera error bypassed.");
        }
     }

     if (vinRegex.test(data)) {
        const truckName = await fetchRealVehicleData(data);
        const secureHash = await hashVIN(data); 

        if (activeVehicle) {
           Alert.alert("Replace Vehicle?", `Current: ${activeVehicle.name}\n\nDo you want to replace it with:\n${truckName}\nID: ${secureHash}?`, [
               { text: "Keep Current", style: "cancel", onPress: () => { isProcessing.current = false; } },
               { text: "Replace", style: "destructive", onPress: () => { setActiveVehicle({ name: truckName, vin: secureHash }); isProcessing.current = false; } }
             ]
           );
        } else {
           const hasParts = jobParts.length > 0;
           Alert.alert(hasParts ? "Assign to Job!" : "Vehicle Identified!", `${truckName}\nID: ${secureHash}`, [
               { text: "Cancel", style: "cancel", onPress: () => { isProcessing.current = false; } },
               { text: hasParts ? "Assign Vehicle" : "Start Workspace", onPress: () => { setActiveVehicle({ name: truckName, vin: secureHash }); isProcessing.current = false; } }
             ]
           );
        }
     } else {
        const productName = await fetchProductByBarcode(data);

        Alert.alert("Part Detected!", `${productName}`, [
            { text: "Add to Job", onPress: () => { 
                setJobParts(prevParts => [...prevParts, { partNumber: productName, photo: tempPhotoData, id: Date.now().toString() }]); 
                setCurrentScreen('ActiveJobScreen'); 
                isProcessing.current = false; 
              } 
            },
            { text: "Instant Search", onPress: () => { 
                setScannedData(productName); 
                setCapturedPhoto(tempPhotoData); 
                setCurrentScreen('InstantSearchScreen'); 
                isProcessing.current = false; 
              } 
            }
          ]
        );
     }
  };

  const handleManualCapture = async () => {
    if (isProcessing.current) return; 
    isProcessing.current = true; 

    let tempPhotoData = null;
    if (cameraRef.current) {
       try {
         const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, base64: true });
         tempPhotoData = `data:image/jpeg;base64,${photo.base64}`;
       } catch (error) {
         Alert.alert("Error", "Could not capture image.");
         isProcessing.current = false;
         return;
       }
    }

    Alert.alert(
      "No Barcode Found", 
      "We couldn't detect a barcode or VIN. Would you like to add this image to your workspace?", 
      [
          { text: "Add to Job", onPress: () => { setJobParts(prevParts => [...prevParts, { partNumber: "Manual Entry", photo: tempPhotoData, id: Date.now().toString() }]); setCurrentScreen('ActiveJobScreen'); isProcessing.current = false; } },
          { text: "Cancel", style: "cancel", onPress: () => { isProcessing.current = false; } }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        facing="back"
        onBarcodeScanned={(manualVinVisible || manualPartVisible) ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr", "upc_a", "code128", "code39"] }}
      >
        
        <View style={styles.topCenterContainer} pointerEvents="box-none">
          {/* NEW: CLEAR MEMORY BUTTON */}
          <TouchableOpacity 
            style={{ position: 'absolute', top: -40, right: 20, backgroundColor: 'rgba(255, 68, 68, 0.8)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#ffaaaa' }} 
            onPress={handleClearMemory}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Clear Memory</Text>
          </TouchableOpacity>
          {!activeVehicle ? (
            <TouchableOpacity style={styles.manualVinButton} onPress={() => setManualVinVisible(true)}>
              <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.manualVinButtonText}>Enter VIN Manually</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.hudPill}>
              <Ionicons name="car-sport" size={18} color="#4da6ff" style={{ marginRight: 8 }} />
              <Text style={styles.hudText}>{activeVehicle.name}</Text>
              
              <TouchableOpacity 
                style={{ paddingVertical: 10, paddingLeft: 15, paddingRight: 5 }} 
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} 
                onPress={() => Alert.alert(
                  "Close Workspace", 
                  "What would you like to do with this active workspace?", 
                  [
                    { text: "Cancel", style: "cancel" }, 
                    { 
                      text: "Delete", 
                      style: "destructive", 
                      onPress: () => {
                        setJobParts([]);
                        setActiveVehicle(null);
                        isProcessing.current = false; 
                      }
                    },
                    { 
                      text: "Save to Archive", 
                      onPress: () => { 
                        const newSavedJob = { id: Date.now().toString(), date: new Date().toLocaleDateString(), title: activeVehicle.name, vin: activeVehicle.vin, parts: jobParts };
                        setSavedJobs(prevJobs => [...prevJobs, newSavedJob]);
                        setJobParts([]);
                        setActiveVehicle(null);
                        isProcessing.current = false; 
                        Alert.alert("Success!", "Workspace safely archived.");
                      } 
                    }
                  ]
                )}
              >
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.manualVinButton, { marginTop: 12, backgroundColor: 'rgba(0,0,0,0.7)', borderColor: '#4da6ff' }]} 
            onPress={() => setManualPartVisible(true)}
          >
            <Ionicons name="barcode-outline" size={18} color="#4da6ff" style={{ marginRight: 8 }} />
            <Text style={styles.manualVinButtonText}>Enter Part Manually</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.overlay} pointerEvents="box-none">
           <TouchableOpacity style={styles.sideMenuButton} onPress={() => setCurrentScreen('ActiveJobScreen')}>
              <Ionicons name="folder-open" size={26} color="#fff" />
              {(jobParts.length > 0 || activeVehicle) && (
                <View style={styles.badge}><Text style={styles.badgeText}>{jobParts.length}</Text></View>
              )}
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.captureButton} onPress={handleManualCapture}>
              <View style={styles.innerButton} />
           </TouchableOpacity>

           <TouchableOpacity style={styles.sideMenuButton} onPress={() => setCurrentScreen('SavedJobsScreen')}>
              <Ionicons name="car-sport" size={28} color="#fff" />
              {savedJobs.length > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{savedJobs.length}</Text></View>
              )}
           </TouchableOpacity>
        </View>

        {/* Clean, Decoupled Components! */}
        <ManualVinModal 
          visible={manualVinVisible} 
          onClose={() => setManualVinVisible(false)} 
          onSubmit={handleManualVinSubmit} 
        />
        
        <ManualPartModal 
          visible={manualPartVisible} 
          onClose={() => setManualPartVisible(false)} 
          onAddPart={handleAddManualPartToJob} 
          onInstantSearch={(partName) => {
             setScannedData(partName); 
             setCapturedPhoto(null); 
             setCurrentScreen('InstantSearchScreen');
          }}
        />

      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionText: { textAlign: 'center', color: 'white', marginBottom: 20 },
  grantButton: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignSelf: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  camera: { flex: 1 },
  
  topCenterContainer: { position: 'absolute', top: 60, width: '100%', alignItems: 'center', zIndex: 50 },
  manualVinButton: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, borderWidth: 1, borderColor: '#aaa', alignItems: 'center', justifyContent: 'center' },
  manualVinButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
  
  hudPill: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 10, paddingLeft: 20, paddingRight: 5, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: '#4da6ff' },
  hudText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  
  overlay: { flex: 1, backgroundColor: 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 50, paddingHorizontal: 40 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  innerButton: { width: 65, height: 65, borderRadius: 35, backgroundColor: '#ff0000' },
  sideMenuButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ff0000', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});