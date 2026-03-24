import { create } from "zustand";
import { messageAPI } from "../utils/api";

const useMessageStore = create((set, get) => ({
  // State
  messages: [],
  isLoading: false,
  error: null,

  // ✅ Create Message (DO NOT replace messages)
  createMessage: async (messageData) => {
    try {
      const response = await messageAPI.createMessage(messageData);

      if (response.success) {
        const newMessage = response.data;

        // ⚠️ DO NOT update state here (important)
        // Socket will handle real-time update

        return { success: true, message: newMessage };
      }
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // ✅ Fetch messages
  getAllMessages: async (roomId) => {
    try {
      set({ isLoading: true, error: null });

      const response = await messageAPI.getAllMessages(roomId);
      console.log("Response of getAllMessages", response);
      if (response.success) {
        const messages = response.data;

        set({
          messages,
          isLoading: false,
        });

        return { success: true, messages };
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
      });

      return { success: false, error: error.message };
    }
  },

  // ✅ Add message from socket (IMPORTANT)
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      messages: [],
      isLoading: false,
      error: null,
    }),
}));

export { useMessageStore };
