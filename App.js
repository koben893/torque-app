import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CameraScreen from './src/screens/CameraScreen';
import ActiveJobScreen from './src/screens/ActiveJobScreen';
import SavedJobsScreen from './src/screens/SavedJobsScreen';
import JobDetailsScreen from './src/screens/JobDetailsScreen';
import InstantSearchScreen from './src/screens/InstantSearchScreen';

export default function App() {
  // --- STATE MANAGEMENT ---
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('CameraScreen');
  const [scannedData, setScannedData] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  
  // Workspace & Archive States
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [jobParts, setJobParts] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // --- 1. THE LOADER: Pull data from the hard drive on boot ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedArchive = await AsyncStorage.getItem('@saved_jobs');
        const storedVehicle = await AsyncStorage.getItem('@active_vehicle');
        const storedParts = await AsyncStorage.getItem('@job_parts');

        if (storedArchive !== null) setSavedJobs(JSON.parse(storedArchive));
        if (storedVehicle !== null) setActiveVehicle(JSON.parse(storedVehicle));
        if (storedParts !== null) setJobParts(JSON.parse(storedParts));
      } catch (error) {
        console.error("Failed to load local data:", error);
      } finally {
        setIsDataLoaded(true); // Tell the app it's safe to render!
      }
    };

    loadData();
  }, []);

  // --- 2. THE SAVER: Auto-sync to the hard drive when things change ---
  useEffect(() => {
    // Prevent the app from overwriting the hard drive with empty arrays before it finishes loading!
    if (!isDataLoaded) return; 

    const saveData = async () => {
      try {
        await AsyncStorage.setItem('@saved_jobs', JSON.stringify(savedJobs));
        await AsyncStorage.setItem('@active_vehicle', JSON.stringify(activeVehicle));
        await AsyncStorage.setItem('@job_parts', JSON.stringify(jobParts));
      } catch (error) {
        console.error("Failed to save local data:", error);
      }
    };

    saveData();
  }, [savedJobs, activeVehicle, jobParts, isDataLoaded]);

  // Show a blank loading screen while the hard drive spins up (usually takes < 100ms)
  if (!isDataLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4da6ff" />
      </View>
    );
  }

  // --- ROUTER ---
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000' }}>
      
      {currentScreen === 'CameraScreen' && (
        <CameraScreen 
          setCurrentScreen={setCurrentScreen}
          setScannedData={setScannedData}
          setCapturedPhoto={setCapturedPhoto}
          activeVehicle={activeVehicle}
          setActiveVehicle={setActiveVehicle}
          jobParts={jobParts}
          setJobParts={setJobParts}
          savedJobs={savedJobs}
          setSavedJobs={setSavedJobs} 
        />
      )}

      {currentScreen === 'ActiveJobScreen' && (
        <ActiveJobScreen 
          setCurrentScreen={setCurrentScreen}
          activeVehicle={activeVehicle}
          setActiveVehicle={setActiveVehicle}
          jobParts={jobParts}
          setJobParts={setJobParts}
          savedJobs={savedJobs}
          setSavedJobs={setSavedJobs}
        />
      )}

      {currentScreen === 'SavedJobsScreen' && (
        <SavedJobsScreen 
          setCurrentScreen={setCurrentScreen}
          savedJobs={savedJobs}
          setSelectedJob={setSelectedJob}
        />
      )}

      {currentScreen === 'JobDetailsScreen' && selectedJob && (
        <JobDetailsScreen 
          setCurrentScreen={setCurrentScreen}
          selectedJob={selectedJob}
          setSelectedJob={setSelectedJob} 
          savedJobs={savedJobs}           
          setSavedJobs={setSavedJobs}
          setActiveVehicle={setActiveVehicle}
          setJobParts={setJobParts}
        />
      )}

      {currentScreen === 'InstantSearchScreen' && (
        <InstantSearchScreen 
          setCurrentScreen={setCurrentScreen}
          scannedData={scannedData}
          capturedPhoto={capturedPhoto}
          activeVehicle={activeVehicle} 
        />
      )}

    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  }
});