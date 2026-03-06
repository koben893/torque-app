import * as Crypto from 'expo-crypto';

// --- 1. THE REAL NHTSA VIN DECODER API ---
export const fetchRealVehicleData = async (vin) => {
  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
    const json = await response.json();

    let make = '';
    let model = '';
    let year = '';

    if (json && json.Results) {
      json.Results.forEach(item => {
        if (item.Variable === "Make") make = item.Value || '';
        if (item.Variable === "Model") model = item.Value || '';
        if (item.Variable === "Model Year") year = item.Value || '';
      });
    }

    if (make || model) {
      return `${year} ${make} ${model}`.trim();
    } else {
      return "Unknown Vehicle";
    }
  } catch (error) {
    console.log("VIN API Error:", error);
    return "Vehicle Lookup Failed (Offline)";
  }
};

// --- 2. UNIVERSAL BARCODE LOOKUP API ---
export const fetchProductByBarcode = async (barcode) => {
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
    const json = await response.json();

    if (json && json.items && json.items.length > 0) {
      const fetchedTitle = json.items[0].title;
      if (fetchedTitle.includes("http://") || fetchedTitle.includes("https://") || fetchedTitle.includes(".com")) {
        return barcode;
      }
      return fetchedTitle; 
    }
    
    return barcode; 
  } catch (error) {
    console.log("Barcode API Error:", error);
    return barcode; 
  }
};

// --- 3. CRYPTO HASHING ---
export const hashVIN = async (rawVin) => {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawVin);
  return digest.substring(0, 10).toUpperCase(); 
};