// Major Indian pincodes organized by state
// This includes popular city pincodes for validation
export interface PincodeData {
  pincode: string;
  city: string;
  state: string;
}

export const indianPincodes: PincodeData[] = [
  // Andhra Pradesh
  { pincode: '500001', city: 'Hyderabad', state: 'Andhra Pradesh' },
  { pincode: '500002', city: 'Hyderabad', state: 'Andhra Pradesh' },
  { pincode: '500003', city: 'Hyderabad', state: 'Andhra Pradesh' },
  { pincode: '530001', city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { pincode: '531001', city: 'Vijayawada', state: 'Andhra Pradesh' },

  // Telangana
  { pincode: '500004', city: 'Hyderabad', state: 'Telangana' },
  { pincode: '500010', city: 'Hyderabad', state: 'Telangana' },
  { pincode: '500020', city: 'Hyderabad', state: 'Telangana' },

  // Karnataka
  { pincode: '560001', city: 'Bangalore', state: 'Karnataka' },
  { pincode: '560002', city: 'Bangalore', state: 'Karnataka' },
  { pincode: '560027', city: 'Bangalore', state: 'Karnataka' },
  { pincode: '575001', city: 'Mangalore', state: 'Karnataka' },
  { pincode: '590001', city: 'Belgaum', state: 'Karnataka' },

  // Maharashtra
  { pincode: '400001', city: 'Mumbai', state: 'Maharashtra' },
  { pincode: '400002', city: 'Mumbai', state: 'Maharashtra' },
  { pincode: '400010', city: 'Mumbai', state: 'Maharashtra' },
  { pincode: '411001', city: 'Pune', state: 'Maharashtra' },
  { pincode: '431001', city: 'Aurangabad', state: 'Maharashtra' },
  { pincode: '440001', city: 'Nagpur', state: 'Maharashtra' },

  // Gujarat
  { pincode: '380001', city: 'Ahmedabad', state: 'Gujarat' },
  { pincode: '380002', city: 'Ahmedabad', state: 'Gujarat' },
  { pincode: '360001', city: 'Rajkot', state: 'Gujarat' },
  { pincode: '395001', city: 'Surat', state: 'Gujarat' },
  { pincode: '364001', city: 'Bhavnagar', state: 'Gujarat' },

  // Rajasthan
  { pincode: '302001', city: 'Jaipur', state: 'Rajasthan' },
  { pincode: '302002', city: 'Jaipur', state: 'Rajasthan' },
  { pincode: '341001', city: 'Bhilwara', state: 'Rajasthan' },
  { pincode: '313001', city: 'Chittorgarh', state: 'Rajasthan' },

  // Tamil Nadu
  { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu' },
  { pincode: '600002', city: 'Chennai', state: 'Tamil Nadu' },
  { pincode: '641001', city: 'Coimbatore', state: 'Tamil Nadu' },
  { pincode: '625001', city: 'Madurai', state: 'Tamil Nadu' },
  { pincode: '629001', city: 'Nagercoil', state: 'Tamil Nadu' },

  // Kerala
  { pincode: '682001', city: 'Kochi', state: 'Kerala' },
  { pincode: '682002', city: 'Kochi', state: 'Kerala' },
  { pincode: '670001', city: 'Kannur', state: 'Kerala' },
  { pincode: '695001', city: 'Thiruvananthapuram', state: 'Kerala' },
  { pincode: '673591', city: 'Kozhikode', state: 'Kerala' },

  // Uttar Pradesh
  { pincode: '201001', city: 'Noida', state: 'Uttar Pradesh' },
  { pincode: '208001', city: 'Kanpur', state: 'Uttar Pradesh' },
  { pincode: '221001', city: 'Varanasi', state: 'Uttar Pradesh' },
  { pincode: '226001', city: 'Lucknow', state: 'Uttar Pradesh' },
  { pincode: '282001', city: 'Agra', state: 'Uttar Pradesh' },

  // Delhi
  { pincode: '110001', city: 'New Delhi', state: 'Delhi' },
  { pincode: '110002', city: 'New Delhi', state: 'Delhi' },
  { pincode: '110003', city: 'New Delhi', state: 'Delhi' },
  { pincode: '110005', city: 'New Delhi', state: 'Delhi' },

  // West Bengal
  { pincode: '700001', city: 'Kolkata', state: 'West Bengal' },
  { pincode: '700002', city: 'Kolkata', state: 'West Bengal' },
  { pincode: '700005', city: 'Kolkata', state: 'West Bengal' },
  { pincode: '734401', city: 'Darjeeling', state: 'West Bengal' },

  // Haryana
  { pincode: '121001', city: 'Faridabad', state: 'Haryana' },
  { pincode: '131001', city: 'Hisar', state: 'Haryana' },
  { pincode: '136001', city: 'Jind', state: 'Haryana' },

  // Punjab
  { pincode: '160001', city: 'Chandigarh', state: 'Punjab' },
  { pincode: '160002', city: 'Chandigarh', state: 'Punjab' },
  { pincode: '140001', city: 'Ludhiana', state: 'Punjab' },
  { pincode: '141008', city: 'Mohali', state: 'Punjab' },

  // Himachal Pradesh
  { pincode: '171001', city: 'Shimla', state: 'Himachal Pradesh' },
  { pincode: '176001', city: 'Dharamshala', state: 'Himachal Pradesh' },

  // Uttarakhand
  { pincode: '247001', city: 'Dehra Dun', state: 'Uttarakhand' },
  { pincode: '263001', city: 'Nainital', state: 'Uttarakhand' },

  // Madhya Pradesh
  { pincode: '452001', city: 'Indore', state: 'Madhya Pradesh' },
  { pincode: '460001', city: 'Bhopal', state: 'Madhya Pradesh' },
  { pincode: '480001', city: 'Gwalior', state: 'Madhya Pradesh' },

  // Bihar
  { pincode: '801101', city: 'Patna', state: 'Bihar' },
  { pincode: '842301', city: 'Gaya', state: 'Bihar' },
  { pincode: '855101', city: 'Madhubani', state: 'Bihar' },

  // Jharkhand
  { pincode: '813001', city: 'Ranchi', state: 'Jharkhand' },
  { pincode: '835001', city: 'Jamshedpur', state: 'Jharkhand' },
  { pincode: '834001', city: 'Dhanbad', state: 'Jharkhand' },

  // Odisha
  { pincode: '751001', city: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '752001', city: 'Cuttack', state: 'Odisha' },
  { pincode: '770001', city: 'Sambalpur', state: 'Odisha' },

  // Assam
  { pincode: '781001', city: 'Guwahati', state: 'Assam' },
  { pincode: '786001', city: 'Silchar', state: 'Assam' },

  // Goa
  { pincode: '403001', city: 'Panaji', state: 'Goa' },
  { pincode: '403801', city: 'Vasco da Gama', state: 'Goa' },

  // Meghalaya
  { pincode: '793001', city: 'Shillong', state: 'Meghalaya' },

  // Tripura
  { pincode: '799001', city: 'Agartala', state: 'Tripura' },

  // Manipur
  { pincode: '795001', city: 'Imphal', state: 'Manipur' },

  // Mizoram
  { pincode: '796001', city: 'Aizawl', state: 'Mizoram' },

  // Nagaland
  { pincode: '797001', city: 'Kohima', state: 'Nagaland' },

  // Sikkim
  { pincode: '737001', city: 'Gangtok', state: 'Sikkim' },

  // Arunachal Pradesh
  { pincode: '790001', city: 'Itanagar', state: 'Arunachal Pradesh' },

  // Jammu and Kashmir
  { pincode: '190001', city: 'Srinagar', state: 'Jammu and Kashmir' },
  { pincode: '190010', city: 'Srinagar', state: 'Jammu and Kashmir' },
  { pincode: '180001', city: 'Jammu', state: 'Jammu and Kashmir' },

  // Ladakh
  { pincode: '194101', city: 'Leh', state: 'Ladakh' },
  { pincode: '194402', city: 'Kargil', state: 'Ladakh' },

  // Chandigarh
  { pincode: '160001', city: 'Chandigarh', state: 'Chandigarh' },

  // Puducherry
  { pincode: '605001', city: 'Puducherry', state: 'Puducherry' },
  { pincode: '609001', city: 'Karaikal', state: 'Puducherry' },

  // Lakshadweep
  { pincode: '682551', city: 'Kavarati', state: 'Lakshadweep' },

  // Andaman and Nicobar
  { pincode: '744101', city: 'Port Blair', state: 'Andaman and Nicobar Islands' },
];

// Get unique pincodes for validation
export const validPincodes = new Set(indianPincodes.map(p => p.pincode));

// Validate pincode format (6 digits)
export const isValidPincodeFormat = (pincode: string): boolean => {
  return /^\d{6}$/.test(pincode);
};

// Check if pincode exists in our database
export const isValidPincodeInDatabase = (pincode: string): boolean => {
  return validPincodes.has(pincode);
};

// Get city and state for a pincode
export const getPincodeCityState = (pincode: string): PincodeData | undefined => {
  return indianPincodes.find(p => p.pincode === pincode);
};

// Get all pincodes for a specific state
export const getPincodesForState = (state: string): PincodeData[] => {
  return indianPincodes.filter(p => p.state === state);
};
