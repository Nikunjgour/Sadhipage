// Ye file ShaadiPage ke saare backend API endpoints ko handle karti hai
// NEW: Axios client aur request/response interceptors use kiye gaye hain token handling aur error normalization ke liye
import axios from 'axios';

// Base URL: .env file me defined VITE_API_URL se aata hai (default http://localhost:8080/api)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * getStoredToken Helper:
 * Ye function localStorage se user ka auth token read karta hai
 * @returns {string|null} - JWT token ya null
 */
export const getStoredToken = () => {
  return localStorage.getItem('shaadi_token') || null;
};

// NEW: Centralized Axios instance configuration
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds (AI generation me thoda time lag sakta hai)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios Request Interceptor:
 * Har outgoing HTTP request me localStorage se JWT bearer token automatic attach karta hai
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Axios Response Interceptor:
 * Successful response se seedhe backend JSON payload ({ success, data, message }) return karta hai
 * aur server errors ko uniform Error format me format karta hai
 */
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const resData = error.response ? error.response.data : null;
    const message =
      (resData && resData.message) ||
      error.message ||
      'Server par koi anpekshit truti aayi.';

    const customError = new Error(message);
    customError.status = status;
    customError.data = resData;
    return Promise.reject(customError);
  }
);

// ----------------------------------------------------
// AUTH API CALLS
// ----------------------------------------------------

/**
 * Naye user ko register karta hai
 * @param {Object} userData - { name, email, password }
 * @returns {Promise<Object>} - { success, data: { token, user }, message }
 */
export async function registerUser(userData) {
  return await apiClient.post('/auth/register', userData);
}

/**
 * User login request bhejta hai aur JWT token return karta hai
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} - { success, data: { token, user }, message }
 */
export async function loginUser(credentials) {
  return await apiClient.post('/auth/login', credentials);
}

/**
 * Logged-in user ki profile details fetch karta hai
 * @returns {Promise<Object>} - { success, data: { user }, message }
 */
export async function getProfile() {
  return await apiClient.get('/auth/profile');
}

/**
 * Logged-in user ki details fetch karta hai (/auth/me endpoint se)
 * @returns {Promise<Object>} - { success, data: { user }, message }
 */
export async function getMe() {
  return await apiClient.get('/auth/me');
}

// ----------------------------------------------------
// USER WEDDING API CALLS
// ----------------------------------------------------

/**
 * Pehli baar wedding details create karta hai
 * @param {Object} weddingData - Dulha, dulhan, venue, date, story
 * @returns {Promise<Object>} - Saved wedding document
 */
export async function createWedding(weddingData) {
  return await apiClient.post('/wedding/create', weddingData);
}

/**
 * Logged-in user ki current wedding details aur generated HTML fetch karta hai
 * @returns {Promise<Object>} - User ka wedding record
 */
export async function getMyWedding() {
  return await apiClient.get('/wedding/my-page');
}

/**
 * Existing wedding details ko update karta hai
 * @param {Object} weddingData - Updated wedding fields
 * @returns {Promise<Object>} - Updated wedding record
 */
export async function updateWedding(weddingData) {
  return await apiClient.put('/wedding/update', weddingData);
}

/**
 * User ki wedding details ko database se delete karta hai
 * @returns {Promise<Object>} - Success message
 */
export async function deleteWedding() {
  return await apiClient.delete('/wedding/delete');
}

/**
 * Wedding photo ko multipart/form-data ke roop me Cloudinary pe upload karta hai
 * @param {File} file - Couple photo binary file
 * @returns {Promise<Object>} - { photoUrl, wedding }
 */
export async function uploadWeddingPhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  return await apiClient.post('/wedding/upload-photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Public wedding page ka data shareSlug ke zariye bina auth fetch karta hai
 * @param {string} shareSlug - Unique wedding slug
 * @returns {Promise<Object>} - Public wedding data with HTML
 */
export async function getPublicWedding(shareSlug) {
  return await apiClient.get(`/wedding/public/${shareSlug}`);
}

/**
 * Guest ka RSVP submit karta hai (Public endpoint, no login needed)
 * @param {Object} rsvpData - { weddingSlug, name, attending, guestCount, email, note }
 * @returns {Promise<Object>} - Saved RSVP details
 */
export async function submitRsvp(rsvpData) {
  return await apiClient.post('/wedding/rsvp', rsvpData);
}

/**
 * Logged-in wedding owner ke liye uski shaadi ke saare RSVPs fetch karta hai
 * @returns {Promise<Object>} - { rsvps, stats }
 */
export async function getWeddingRsvps() {
  return await apiClient.get('/wedding/rsvps');
}

// ----------------------------------------------------
// AI GENERATION API CALLS
// ----------------------------------------------------

/**
 * AI service ko wedding webpage generate karne ka order bhejta hai
 * @param {Object} payload - Optional parameters
 * @returns {Promise<Object>} - Updated wedding with generatedHTML
 */
export async function generateAIPage(payload = {}) {
  // Ab job background me chalti hai — is call sirf 'Generation shuru ho gaya'
  // 202 response deta hai (instant), isliye default timeout hi sufficient hai.
  return await apiClient.post('/ai/generate', payload);
}

// ----------------------------------------------------
// ADMIN API CALLS
// ----------------------------------------------------

/**
 * Admin analytics data (total users, weddings, counts) fetch karta hai
 * @returns {Promise<Object>} - Analytics data
 */
export async function adminGetAnalytics() {
  return await apiClient.get('/admin/analytics');
}

/**
 * Admin panel ke liye saare registered users ki list laata hai
 * @returns {Promise<Object>} - Users array
 */
export async function adminGetUsers() {
  return await apiClient.get('/admin/users');
}

/**
 * Admin ko kisi user ka data (naam, email, role) update karne deta hai
 * @param {string} id - User ID
 * @param {Object} userData - Updated fields
 * @returns {Promise<Object>} - Updated user
 */
export async function adminUpdateUser(id, userData) {
  return await apiClient.put(`/admin/users/${id}`, userData);
}

/**
 * Admin panel se user ko permanently delete karta hai
 * @param {string} id - User ID
 * @returns {Promise<Object>} - Success message
 */
export async function adminDeleteUser(id) {
  return await apiClient.delete(`/admin/users/${id}`);
}

/**
 * Admin panel ke liye saare wedding projects ki list laata hai
 * @returns {Promise<Object>} - Weddings array
 */
export async function adminGetWeddings() {
  return await apiClient.get('/admin/weddings');
}

/**
 * Admin ko kisi bhi wedding project ke details ya HTML edit karne deta hai
 * @param {string} id - Wedding ID
 * @param {Object} weddingData - Updated wedding fields
 * @returns {Promise<Object>} - Updated wedding
 */
export async function adminUpdateWedding(id, weddingData) {
  return await apiClient.put(`/admin/weddings/${id}`, weddingData);
}

/**
 * Admin panel se kisi wedding project ko delete karta hai
 * @param {string} id - Wedding ID
 * @returns {Promise<Object>} - Success confirmation
 */
export async function adminDeleteWedding(id) {
  return await apiClient.delete(`/admin/weddings/${id}`);
}
