import apiClient from '../../common/utils/apiClient';

export const errorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.message || fallback;

export const getGoogleReviewsStatus = async () => (await apiClient.get('/google-reviews/status')).data;

export const listGoogleReviews = async (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== 'all'));
  return (await apiClient.get('/google-reviews', { params: clean })).data;
};

export const getGoogleAuthUrl = async () => (await apiClient.get('/google-reviews/auth-url')).data.url;

export const getGoogleLocations = async () => (await apiClient.get('/google-reviews/locations')).data;

export const selectGoogleLocation = async (accountName, locationName) =>
  (await apiClient.put('/google-reviews/location', { accountName, locationName })).data;

export const syncGoogleReviews = async (full = false) => (await apiClient.post('/google-reviews/sync', { full })).data;

export const replyToGoogleReview = async (reviewId, comment) =>
  (await apiClient.put(`/google-reviews/${encodeURIComponent(reviewId)}/reply`, { comment })).data.review;

export const deleteGoogleReviewReply = async (reviewId) =>
  (await apiClient.delete(`/google-reviews/${encodeURIComponent(reviewId)}/reply`)).data.review;

export const disconnectGoogleReviews = async () => (await apiClient.delete('/google-reviews/connection')).data;
