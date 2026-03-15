import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, FlatList, useWindowDimensions, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function SavedJobsScreen({
  setCurrentScreen,
  savedJobs,
  setSelectedJob
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <View style={[styles.jobContainer, { paddingTop: Math.max(insets.top + 10, 20), paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
      <View style={styles.jobHeaderRow}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => setCurrentScreen('CameraScreen')}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerText}>Saved Jobs</Text>
          <Text style={styles.subText}>{savedJobs.length} Completed</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {savedJobs.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="car-sport-outline" size={80} color="#444" />
          <Text style={[styles.subText, { marginTop: 20 }]}>No vehicles saved yet.</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={savedJobs}
            keyExtractor={(item) => item.id}
            horizontal={true}
            pagingEnabled={true}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedJob(item);
                  setCurrentScreen('JobDetailsScreen');
                }}
              >
                <View style={[styles.galleryCard, { width: width * 0.9, marginHorizontal: width * 0.05 }]}>
                  {item.parts[0]?.photo ? (
                    <Image source={{ uri: item.parts[0].photo }} style={styles.galleryImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.noImagePlaceholder}><Ionicons name="construct" size={60} color="#555" /></View>
                  )}
                  <View style={styles.galleryInfoBox}>
                    <Text style={[styles.galleryPartNumber, { fontSize: 22, textAlign: 'center' }]}>{item.title}</Text>
                    <Text style={styles.galleryPartTitle}>ID: {item.vin}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
                      <Text style={[styles.subText, { marginTop: 0, marginRight: 5 }]}>View {item.parts.length} part(s)</Text>
                      <Ionicons name="arrow-forward-circle" size={18} color="#aaa" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* --- LEGAL LINKS FOOTER --- */}
      <View style={styles.legalFooter}>
        <TouchableOpacity onPress={() => openLink('https://ctoand.co/torqueai-privacypolicy')}>
          <Text style={styles.legalLinkText}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.legalDivider}> | </Text>
        <TouchableOpacity onPress={() => openLink('https://ctoand.co/torqueai-termsofservice')}>
          <Text style={styles.legalLinkText}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  jobContainer: { flex: 1, backgroundColor: '#111' },
  jobHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  headerBackButton: { padding: 5 },
  headerText: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subText: { color: '#aaa', fontSize: 16, marginTop: 5, textAlign: 'center' },

  galleryCard: { backgroundColor: '#222', borderRadius: 20, overflow: 'hidden', height: '75%' },
  galleryImage: { width: '100%', height: '70%' },
  noImagePlaceholder: { width: '100%', height: '70%', backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  galleryInfoBox: { padding: 20, justifyContent: 'center', alignItems: 'center' },
  galleryPartTitle: { color: '#888', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  galleryPartNumber: { color: '#fff', fontWeight: 'bold', marginTop: 5 },

  legalFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 10, paddingBottom: 5 },
  legalLinkText: { color: '#888', fontSize: 13, textDecorationLine: 'underline' },
  legalDivider: { color: '#555', fontSize: 14, marginHorizontal: 8 }
});