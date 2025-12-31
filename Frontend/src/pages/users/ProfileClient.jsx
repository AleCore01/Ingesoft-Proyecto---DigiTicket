import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { userProfileService } from '../../services/userProfileService';
import SideBarMenuClient from '../../components/Layout/SideBarMenuClient';
import TopBar from '../../components/Layout/TopBar';
import ProfileForm from '../../components/Profile/ProfileForm';
import LoyaltyCard from '../../components/Profile/LoyaltyCard';
import PasswordChangeForm from '../../components/Profile/PasswordChangeForm';
import ModalCheck from '../../components/Modal/ModalCheck';
import { User, Lock, Award, ShoppingBag, Loader } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const ProfileClient = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loyaltyHistory, setLoyaltyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: User },
    { id: 'password', label: 'Seguridad', icon: Lock },
    { id: 'loyalty', label: 'Puntos', icon: Award }
  ];

  useEffect(() => {
    loadProfile();
    loadLoyaltyHistory();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await userProfileService.getProfile(user?.id);
      if (response.ok) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Mostrar error al usuario si es necesario
    } finally {
      setLoading(false);
    }
  };

  const loadLoyaltyHistory = async () => {
    try {
      const response = await userProfileService.getLoyaltyHistory(user?.id);
      if (response.ok) {
        setLoyaltyHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading loyalty history:', error);
      setLoyaltyHistory([]); // Array vacío en caso de error
    }
  };

  const handleSaveProfile = async (profileData) => {
    try {
      const response = await userProfileService.updateProfile(user?.id, profileData);
      if (response.ok) {
        setProfile(response.data);
        setIsEditingProfile(false);
        setSuccessMessage('Perfil actualizado exitosamente');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleChangePassword = async (passwordData) => {
    try {
      const response = await userProfileService.updatePassword(user?.id, passwordData);
      if (response.ok) {
        setSuccessMessage('Contraseña actualizada exitosamente');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.message || 'Error al cambiar la contraseña');
    }
  };

  const formatDate = (dateString) => {
    try {
      return dayjs(dateString).locale('es').format('D [de] MMMM, YYYY');
    } catch {
      return dateString;
    }
  };

  const renderProfileView = () => {
    if (!profile) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Información Personal</h3>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium rounded-2xl transition shadow-md"
              >
                Editar perfil
              </button>
            )}
          </div>

          <div className="flex items-center gap-6 mb-8">
            <img
              src={profile.avatar}
              alt={profile.firstName}
              className="w-24 h-24 rounded-full border-4 border-fuchsia-100"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-600">{profile.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Miembro desde {formatDate(profile.memberSince)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Teléfono</p>
              <p className="font-medium text-gray-900">{profile.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Documento</p>
              <p className="font-medium text-gray-900">
                {profile.documentType} {profile.documentNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Fecha de nacimiento</p>
              <p className="font-medium text-gray-900">{formatDate(profile.birthDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Género</p>
              <p className="font-medium text-gray-900">
                {profile.gender === 'M' ? 'Masculino' : profile.gender === 'F' ? 'Femenino' : 'Otro'}
              </p>
            </div>
          </div>

          {/* Dirección: no disponible en el backend por el momento */}
          {/* TODO: Agregar soporte para dirección en el backend */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h4 className="text-base font-normal text-gray-700 mb-3">Total de compras</h4>
            <div className="flex items-center justify-between">
              <p className="text-5xl font-bold text-fuchsia-600">{profile.totalPurchases || 0}</p>
              <ShoppingBag size={32} className="text-fuchsia-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h4 className="text-base font-normal text-gray-700 mb-3">Puntos acumulados</h4>
            <div className="flex items-center justify-between">
              <p className="text-5xl font-bold text-green-600">{profile.loyaltyPoints || 0}</p>
              <Award size={32} className="text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h4 className="text-base font-normal text-gray-700 mb-3">Total gastado</h4>
            <div className="flex items-center justify-between">
              <p className="text-5xl font-bold text-blue-600">S/. {(profile.totalSpent || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-backgroundGeneral">
      <div className="flex h-screen">
        <SideBarMenuClient />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Cuenta</h1>
              <p className="text-gray-600">
                Gestiona tu información personal y preferencias
              </p>
            </div>

            {/* Selector de pestañas estilo pago */}
            <div className="bg-white rounded-2xl shadow-md mb-6">
              <div className="px-8 pt-6 pb-2">
                <div className="flex items-center gap-8 mb-4">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsEditingProfile(false);
                        }}
                        className="relative flex items-center gap-2"
                      >
                        <Icon 
                          size={24} 
                          className={`transition-colors ${
                            activeTab === tab.id ? 'text-fuchsia-600' : 'text-gray-400'
                          }`}
                        />
                        <span className={`text-base transition-colors ${
                          activeTab === tab.id ? 'text-gray-800' : 'text-gray-400'
                        }`}>
                          {tab.label}
                        </span>
                        {activeTab === tab.id && (
                          <div className="absolute bottom-[-16px] left-0 right-0 h-0.5 bg-fuchsia-600"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Línea divisoria completa */}
                <div className="border-b border-gray-200"></div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="animate-spin text-fuchsia-600" size={48} />
              </div>
            ) : (
              <>
                {activeTab === 'profile' && (
                  <>
                    {isEditingProfile ? (
                      <ProfileForm
                        profile={profile}
                        onSave={handleSaveProfile}
                        onCancel={() => setIsEditingProfile(false)}
                      />
                    ) : (
                      renderProfileView()
                    )}
                  </>
                )}

                {activeTab === 'password' && (
                  <PasswordChangeForm
                    onSave={handleChangePassword}
                    onCancel={() => setActiveTab('profile')}
                  />
                )}

                {activeTab === 'loyalty' && (
                  <LoyaltyCard
                    points={profile?.loyaltyPoints || 0}
                    history={loyaltyHistory}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ModalCheck
        isOpen={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
};

export default ProfileClient;
