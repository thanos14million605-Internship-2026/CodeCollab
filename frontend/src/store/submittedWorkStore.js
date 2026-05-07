import { create } from "zustand";
import { submittedWorkAPI } from "../utils/api";
import toast from "react-hot-toast";

const useSubmittedWorkStore = create((set) => ({
  submissions: [],
  isLoading: false,
  error: null,

  fetchAllSubmissions: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await submittedWorkAPI.getAll();

      if (response.success) {
        set({ submissions: response.data, isLoading: false });
        return { success: true, data: response.data };
      }
    } catch (error) {
      set({ isLoading: false, error: error.message });
      toast.error(error.message || "Failed to fetch submissions");
      return { success: false, error: error.message };
    }
  },

  clearSubmissions: () => set({ submissions: [], error: null }),
}));

export { useSubmittedWorkStore };
