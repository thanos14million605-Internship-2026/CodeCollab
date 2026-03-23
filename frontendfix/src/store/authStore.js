import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../utils/api';
import { STORAGE_KEYS } from '../utils/constants';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (credentials) => {
        try {
          set({ isLoading: true });
          const response = await authAPI.login(credentials);
          
          if (response.success) {
            const { user, token } = response.data;
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });

            // Store in localStorage
            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

            toast.success('Logged in successfully!');
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          toast.error(error.message || 'Login failed');
          return { success: false, error: error.message };
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true });
          const response = await authAPI.register(userData);
          
          if (response.success) {
            const { user, token } = response.data;
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });

            // Store in localStorage
            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

            toast.success('Account created successfully!');
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          toast.error(error.message || 'Registration failed');
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });

        // Clear localStorage
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);

        toast.success('Logged out successfully');
      },

      updateProfile: async (userData) => {
        try {
          set({ isLoading: true });
          const response = await authAPI.updateProfile(userData);
          
          if (response.success) {
            const updatedUser = response.data.user;
            
            set({
              user: updatedUser,
              isLoading: false,
            });

            // Update localStorage
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

            toast.success('Profile updated successfully!');
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          toast.error(error.message || 'Profile update failed');
          return { success: false, error: error.message };
        }
      },

      forgotPassword: async (email) => {
        try {
          set({ isLoading: true });
          const response = await authAPI.forgotPassword(email);
          
          if (response.success) {
            set({ isLoading: false });
            toast.success('Password reset email sent!');
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          toast.error(error.message || 'Failed to send reset email');
          return { success: false, error: error.message };
        }
      },

      resetPassword: async (data) => {
        try {
          set({ isLoading: true });
          const response = await authAPI.resetPassword(data);
          
          if (response.success) {
            set({ isLoading: false });
            toast.success('Password reset successfully!');
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          toast.error(error.message || 'Password reset failed');
          return { success: false, error: error.message };
        }
      },

      // Initialize auth state from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
            });
          } catch (error) {
            console.error('Failed to parse user data:', error);
            // Clear invalid data
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
          }
        }
      },

      // Clear loading state
      clearLoading: () => set({ isLoading: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };
