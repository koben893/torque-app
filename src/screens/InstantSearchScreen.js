import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, PanResponder, useWindowDimensions, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- GOOGLE SEARCH API SETUP ---
const GOOGLE_API_KEY = 'AIzaSyD2JxRaCLlcXQoi4D8B-vVbYN4vleFKQZo'; 
const SEARCH_ENGINE_ID = '92ba2650a8f174c4a';

export default function InstantSearchScreen({ 
  setCurrentScreen, 
  scannedData, 
  capturedPhoto,
  activeVehicle 
}) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  
  // Search States
  const [isLoading, setIsLoading] = useState(true);
  const [torqueResult, setTorqueResult] = useState("");
  const [searchTitle, setSearchTitle] = useState("Spec Results"); 

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const pan = useRef(new Animated.ValueXY()).current;
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

  const boxWidth = isLandscape ? width * 0.4 : width * 0.85;

  // --- THE WEB SEARCH ENGINE + CACHING ---
  useEffect(() => {
    const fetchTorqueSpecs = async () => {
      setIsLoading(true);

      const vehicleName = activeVehicle ? activeVehicle.name : "";
      const searchQuery = `${vehicleName} ${scannedData} torque specs`.trim();
      
      const cacheKey = `@cache_${searchQuery.replace(/\s+/g, '_').toLowerCase()}`;

      try {
        // 1. CHECK THE HARD DRIVE FIRST
        const cachedData = await AsyncStorage.getItem(cacheKey);
        
        if (cachedData !== null) {
          const parsedData = JSON.parse(cachedData);
          setSearchTitle(parsedData.title + " (Cached)"); 
          setTorqueResult(parsedData.snippet);
          setIsLoading(false);
          return; 
        }

        // 2. ASK GOOGLE
        const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}`);
        const json = await response.json();

        if (json.items && json.items.length > 0) {
          // Grab the title from the #1 result
          const fetchedTitle = json.items[0].title;
          
          // NEW: Grab the top 3 results, pull their snippets, and combine them with bullet points!
          // This ensures we catch forum discussions and highly detailed specs that might not be in the #1 slot.
          const topSnippets = json.items
            .slice(0, 3)
            .map(item => `• ${item.snippet.replace(/\n/g, ' ')}`) // Clean up weird formatting
            .join('\n\n');

          setSearchTitle(fetchedTitle); 
          setTorqueResult(topSnippets);

          // 3. SAVE IT TO THE HARD DRIVE
          const dataToCache = JSON.stringify({ title: fetchedTitle, snippet: topSnippets });
          await AsyncStorage.setItem(cacheKey, dataToCache);

        } else {
          setSearchTitle("No Results Found");
          setTorqueResult("Could not find specific specs online. Ensure your Custom Search Engine is set to 'Search the entire web'.");
        }
      } catch (error) {
        console.log("Search/Cache Error:", error);
        setSearchTitle("Network Error");
        setTorqueResult("Could not reach the search engine.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTorqueSpecs();
  }, [scannedData, activeVehicle]);

  return (
    <View style={[styles.searchContainer, isHighContrast && styles.highContrastContainer]}>
      {capturedPhoto && !isHighContrast && (
        <Image source={{ uri: capturedPhoto }} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
      )}
      {capturedPhoto && !isHighContrast && <View style={styles.darkTintOverlay} />}

      {!isHighContrast && (
        <>
          <Text style={styles.headerText}>Instant Search</Text>
          <Text style={styles.subText}>{activeVehicle ? activeVehicle.name : "Unknown Vehicle"}</Text>
          <Text style={[styles.subText, { color: '#4da6ff', fontWeight: 'bold' }]}>Part: {scannedData}</Text>
        </>
      )}
      
      <Animated.View 
        style={[
          styles.torqueBox, 
          { width: isHighContrast ? width : boxWidth }, 
          isHighContrast && styles.highContrastBox,     
          !isHighContrast && pan.getLayout()            
        ]} 
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={[styles.contrastToggle, isHighContrast && styles.highContrastToggleSafeArea]} 
          onPress={() => setIsHighContrast(!isHighContrast)}
        >
          <Ionicons name={isHighContrast ? "bulb" : "bulb-outline"} size={28} color={isHighContrast ? "#000" : "#555"} />
        </TouchableOpacity>
        
        <Text style={[styles.torqueTitle, isHighContrast && styles.highContrastText, { textAlign: 'center' }]}>
          {searchTitle}
        </Text>
        
        {isLoading ? (
          <View style={{ marginVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4da6ff" />
            <Text style={{ marginTop: 10, color: '#666' }}>Searching web...</Text>
          </View>
        ) : (
          <Text style={[styles.torqueInstruction, isHighContrast && styles.highContrastText, { marginVertical: 20, textAlign: 'left' }]}>
            {torqueResult}
          </Text>
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
  searchContainer: { flex: 1, backgroundColor: '#1a1a1a', alignItems: 'center', paddingTop: 80 },
  darkTintOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  headerText: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subText: { color: '#aaa', fontSize: 16, marginTop: 5, textAlign: 'center', paddingHorizontal: 20 },
  
  // I slightly increased the box height so it can comfortably fit the 3 bullet points!
  torqueBox: { backgroundColor: '#fff', padding: 30, borderRadius: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8, minHeight: 250 },
  contrastToggle: { position: 'absolute', top: 15, right: 15, padding: 5, zIndex: 10 },
  torqueTitle: { fontSize: 18, color: '#333', fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  torqueInstruction: { fontSize: 15, color: '#444', fontStyle: 'italic', lineHeight: 22 },
  
  backButton: { position: 'absolute', bottom: 50, backgroundColor: '#ff0000', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  highContrastContainer: { backgroundColor: '#fff', paddingTop: 0 },
  highContrastBox: { height: '100%', borderRadius: 0, justifyContent: 'center', shadowOpacity: 0, elevation: 0 },
  highContrastToggleSafeArea: { top: 60, right: 25 },
  highContrastText: { color: '#000', fontSize: 20, fontWeight: 'bold' },
  highContrastBackButton: { bottom: 30, backgroundColor: '#000', borderWidth: 2, borderColor: '#fff' }
});