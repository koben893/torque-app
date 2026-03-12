import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, PanResponder, useWindowDimensions, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAITorqueSpecs } from '../utils/api'; 

export default function InstantSearchScreen({ 
  setCurrentScreen, 
  scannedData, 
  capturedPhoto,
  activeVehicle 
}) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [torqueResult, setTorqueResult] = useState("");
  const [searchTitle, setSearchTitle] = useState("AI Spec Analysis"); 

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const pan = useRef(new Animated.ValueXY()).current;
  
  // The PanResponder now only controls whatever we specifically attach it to (our new header!)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !isHighContrast, 
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false } 
      ),
      onPanResponderRelease: () => { pan.extractOffset(); },
    })
  ).current;

  const boxWidth = isLandscape ? width * 0.4 : width * 0.90; // Made the box slightly wider for bigger text

  useEffect(() => {
    const getSpecs = async () => {
      setIsLoading(true);

      const vehicleName = activeVehicle ? activeVehicle.name : "Unknown Vehicle";
      const cacheKey = `@ai_cache_${vehicleName.replace(/\s+/g, '_')}_${scannedData.replace(/\s+/g, '_')}`.toLowerCase();

      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        
        if (cachedData !== null) {
          setSearchTitle("AI Spec Analysis (Cached)"); 
          setTorqueResult(cachedData);
          setIsLoading(false);
          return; 
        }

        const aiResponse = await fetchAITorqueSpecs(vehicleName, scannedData);

        setSearchTitle("AI Spec Analysis"); 
        setTorqueResult(aiResponse);

        await AsyncStorage.setItem(cacheKey, aiResponse);

      } catch (error) {
        console.log("Cache/AI Error:", error);
        setSearchTitle("System Error");
        setTorqueResult("Could not process the request.");
      } finally {
        setIsLoading(false);
      }
    };

    getSpecs();
  }, [scannedData, activeVehicle]);

  return (
    <View style={[styles.searchContainer, isHighContrast && styles.highContrastContainer]}>
      {capturedPhoto && !isHighContrast && (
        <Image source={{ uri: capturedPhoto }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
      )}
      {capturedPhoto && !isHighContrast && <View style={styles.darkTintOverlay} />}

      {!isHighContrast && (
        <View style={styles.headerArea}>
          <Text style={styles.headerText}>Instant Search</Text>
          <Text style={styles.subText}>{activeVehicle ? activeVehicle.name : "Unknown Vehicle"}</Text>
          <Text style={[styles.subText, { color: '#4da6ff', fontWeight: 'bold' }]}>Part: {scannedData}</Text>
        </View>
      )}
      
      {/* Notice we removed the panHandlers from this outer view! */}
      <Animated.View 
        style={[
          styles.torqueBox, 
          { width: isHighContrast ? width : boxWidth }, 
          isHighContrast && styles.highContrastBox,     
          !isHighContrast && pan.getLayout()            
        ]} 
      >
        
        {/* DRAG ZONE: Only this specific header area handles the drag gestures now */}
        <View style={[styles.dragZone, isHighContrast && { backgroundColor: '#fff', borderBottomWidth: 0 }]} {...panResponder.panHandlers}>
          {!isHighContrast && <View style={styles.dragPill} />}
          <Text style={[styles.torqueTitle, isHighContrast && styles.highContrastText]}>
            {searchTitle}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.contrastToggle, isHighContrast && styles.highContrastToggleSafeArea]} 
          onPress={() => setIsHighContrast(!isHighContrast)}
        >
          <Ionicons name={isHighContrast ? "bulb" : "bulb-outline"} size={28} color={isHighContrast ? "#000" : "#555"} />
        </TouchableOpacity>
        
        {/* SCROLL ZONE: Completely free to scroll without moving the box */}
        {isLoading ? (
          <View style={{ marginVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4da6ff" />
            <Text style={{ marginTop: 15, color: '#666', fontSize: 16 }}>Consulting AI Mechanic...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollArea} 
            contentContainerStyle={{ padding: 25, paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.torqueInstruction, isHighContrast && styles.highContrastText]}>
              {torqueResult}
            </Text>
          </ScrollView>
        )}
      </Animated.View>

      <TouchableOpacity 
        style={[styles.backButton, isHighContrast && styles.highContrastBackButton]} 
        onPress={() => setCurrentScreen('CameraScreen')}
      >
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: { flex: 1, backgroundColor: '#1a1a1a', alignItems: 'center', paddingTop: 60 },
  darkTintOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  
  headerArea: { alignItems: 'center', marginBottom: 20, zIndex: -1 },
  headerText: { color: '#fff', fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
  subText: { color: '#ddd', fontSize: 16, marginTop: 5, textAlign: 'center', paddingHorizontal: 20 },
  
  torqueBox: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 10, 
    elevation: 10, 
    maxHeight: '65%', 
    minHeight: 300,
    overflow: 'hidden', // Ensures the drag header stays neatly inside the rounded corners
    flexDirection: 'column'
  },
  
  // NEW: Dedicated header just for dragging
  dragZone: {
    width: '100%',
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  dragPill: {
    width: 60,
    height: 6,
    backgroundColor: '#bbb',
    borderRadius: 3,
    marginBottom: 10,
  },
  
  contrastToggle: { position: 'absolute', top: 15, right: 20, padding: 5, zIndex: 10 },
  torqueTitle: { fontSize: 18, color: '#333', fontWeight: 'bold', textAlign: 'center' },
  
  scrollArea: { flex: 1, width: '100%' },
  
  // BIG AND BOLD TEXT
  torqueInstruction: { 
    fontSize: 24, 
    color: '#111', 
    lineHeight: 34, 
    fontWeight: '900', // Maximum boldness
    textAlign: 'left' 
  },
  
  backButton: { position: 'absolute', bottom: 40, backgroundColor: '#ff0000', paddingVertical: 18, paddingHorizontal: 50, borderRadius: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5 },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  highContrastContainer: { backgroundColor: '#fff', paddingTop: 0 },
  highContrastBox: { height: '100%', borderRadius: 0, justifyContent: 'center', shadowOpacity: 0, elevation: 0, maxHeight: '100%' },
  highContrastToggleSafeArea: { top: 60, right: 25 },
  highContrastText: { color: '#000', fontSize: 28, fontWeight: '900', lineHeight: 38 },
  highContrastBackButton: { bottom: 30, backgroundColor: '#000', borderWidth: 2, borderColor: '#fff' }
});