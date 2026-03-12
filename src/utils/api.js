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

// --- 4. AI MECHANIC (GEMINI API) ---
export const fetchAITorqueSpecs = async (vehicle, part) => {
  const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `You are a master heavy-duty diesel and auto mechanic. I am working on a ${vehicle} and need the installation torque specs for: ${part}.
  CRITICAL INSTRUCTIONS:
  - Provide ONLY the exact torque specifications.
  - Use short bullet points.
  - DO NOT include any introductory text, safety warnings, or extra explanations.
  - If there are thread variations (lubricated vs dry) or material variations (aluminum vs cast iron), list them on a single line.
  Just give me the numbers.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    const json = await response.json();
    
    // THE DIAGNOSTIC CATCH: If Google throws an error, return the exact text of the error!
    if (json.error) {
      console.log("GOOGLE API ERROR:", json.error);
      return `Google API Error [${json.error.code}]: ${json.error.message}`;
    }
    
    if (json.candidates && json.candidates.length > 0) {
      return json.candidates[0].content.parts[0].text;
    } else {
      return "The AI returned a blank response. It may have been blocked by safety filters.";
    }
  } catch (error) {
    console.log("Fetch Error:", error);
    return "Network connection failed. Could not reach Google's servers.";
  }
};