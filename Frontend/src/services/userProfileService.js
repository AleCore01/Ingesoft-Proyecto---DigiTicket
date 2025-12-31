import { mockUserProfile, mockLoyaltyHistory } from '../mocks/userData';
import { api } from './http';

const USE_MOCK_DATA = false;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const userProfileService = {
  getProfile: async (userId) => {
    if (USE_MOCK_DATA) {
      await delay(400);
      return { ok: true, data: mockUserProfile };
    }
    
    // Backend: /api/users/{userId}/profile
    const profileData = await api.get(`api/users/${userId}/profile`);
    
    console.log('📊 Datos del perfil desde el backend:', profileData);
    
    // Cargar puntos de lealtad desde el endpoint correspondiente
    try {
      const pointsData = await api.get(`api/loyalty/points/balance`, {
        params: { clientId: userId }
      });
      console.log('💰 Puntos desde el backend:', pointsData);
      profileData.loyaltyPoints = pointsData.totalPoints || 0;
    } catch (err) {
      console.warn('No se pudieron cargar los puntos:', err);
      profileData.loyaltyPoints = 0;
    }
    
    // Generar avatar con DiceBear API usando el nombre del usuario
    profileData.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileData.firstName || 'User')}`;
    
    console.log('✅ Datos finales del perfil:', profileData);
    return { ok: true, data: profileData };
  },

  updateProfile: async (userId, profileData) => {
    if (USE_MOCK_DATA) {
      await delay(600);
      Object.assign(mockUserProfile, profileData);
      return { ok: true, data: mockUserProfile };
    }
    
    // Backend: PUT /api/users/{userId}/profile
    const updatedData = await api.put(`api/users/${userId}/profile`, profileData);
    
    // Generar avatar actualizado
    updatedData.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(updatedData.firstName || 'User')}`;
    
    return { ok: true, data: updatedData };
  },

  updatePassword: async (userId, passwordData) => {
    if (USE_MOCK_DATA) {
      await delay(500);
      return { ok: true, message: 'Password updated successfully' };
    }
    
    // TODO: Backend endpoint not implemented yet
    // Endpoint esperado: PUT /api/users/{userId}/password
    throw new Error('La función de cambio de contraseña aún no está disponible. Por favor contacta al administrador.');
  },

  getLoyaltyHistory: async (userId) => {
    if (USE_MOCK_DATA) {
      await delay(400);
      return {
        ok: true,
        data: mockLoyaltyHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    }
    
    // Backend: /api/loyalty/points/history?clientId={userId}
    const data = await api.get(`api/loyalty/points/history`, {
      params: { clientId: userId }
    });
    
    // Normalizar al formato del frontend
    const normalized = (data || []).map(item => ({
      id: item.id,
      date: item.createdAt,
      description: item.description || `Puntos ${item.status || 'activos'}`,
      points: item.points,
      type: item.type || (item.status === 'USED' ? 'redeemed' : 'earned'),
      balance: item.balance || 0
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return { ok: true, data: normalized };
  },

  updatePreferences: async (userId, preferences) => {
    if (USE_MOCK_DATA) {
      await delay(500);
      mockUserProfile.preferences = { ...mockUserProfile.preferences, ...preferences };
      return { ok: true, data: mockUserProfile.preferences };
    }
    
    // TODO: Backend endpoint not implemented yet
    // Endpoint esperado: PUT /api/users/{userId}/preferences
    throw new Error('La función de preferencias aún no está disponible.');
  }
};
