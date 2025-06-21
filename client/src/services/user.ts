const API_BASE_URL = '/api';

async function callApi(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    const error = new Error(errorData.message || 'An API error occurred');
    (error as any).status = response.status; // Attach the status code to the error object
    throw error;
  }

  return response.json();
}

export const userService = {
  getUserByFirebaseUid: (uid: string) => callApi(`/users/firebase/${uid}`),
  createUser: (userData: any) => callApi('/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (uid: string, userData: any) => callApi(`/users/${uid}`, { method: 'PUT', body: JSON.stringify(userData) }),
};