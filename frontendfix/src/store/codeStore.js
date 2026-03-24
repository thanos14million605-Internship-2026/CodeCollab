import { create } from "zustand";
import { codeAPI } from "../utils/api";

const useCodeStore = create((set) => ({
  isUploading: false,
  error: null,

  uploadCodePDF: async (payload) => {
    try {
      set({ isUploading: true, error: null });

      const response = await codeAPI.uploadPDF(payload);

      if (response.success) {
        set({ isUploading: false });
        return { success: true, data: response.data };
      }
    } catch (error) {
      set({
        isUploading: false,
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null }),
}));

export { useCodeStore };
