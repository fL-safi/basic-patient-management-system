import axios from 'axios';

// Get the base URL depending on the environment (development or production)
const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000/api'   // Development URL
  : '/api';                        // Production URL (relative to the deployed server)

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensure cookies are sent with requests
});

// API call to register a doctor
export const registerDoctor = async (userData) => {
  try {
    const response = await axiosInstance.post('/admin/register/doctor', userData);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API call to register a receptionist
export const registerReceptionist = async (userData) => {
  try {
    const response = await axiosInstance.post('/admin/register/receptionist', userData);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API call to register a pharmacist dispenser
export const registerPharmacistDispenser = async (userData) => {
  try {
    const response = await axiosInstance.post('/admin/register/pharmacist-dispenser', userData);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API call to register a pharmacist inventory
export const registerPharmacistInventory = async (userData) => {
  try {
    const response = await axiosInstance.post('/admin/register/pharmacist-inventory', userData);
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API call to get all user data
export const getUsersData = async () => {
  try {
    const response = await axiosInstance.get('/admin/get-users-data');
    return response.data; // Return the API response data
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// You can add more API functions here as needed
