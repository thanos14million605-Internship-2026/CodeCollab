import { create } from 'zustand';
import { roomAPI } from '../utils/api';
import toast from 'react-hot-toast';

const useRoomStore = create((set, get) => ({
  // State
  currentRoom: null,
  participants: [],
  rooms: [],
  isLoading: false,
  isJoiningRoom: false,
  error: null,

  // Actions
  createRoom: async (roomData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await roomAPI.createRoom(roomData);
      
      if (response.success) {
        const room = response.data.room;
        
        set({
          currentRoom: room,
          isLoading: false,
        });

        toast.success('Room created successfully!');
        return { success: true, room };
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message 
      });
      toast.error(error.message || 'Failed to create room');
      return { success: false, error: error.message };
    }
  },

  joinRoom: async (roomCode) => {
    try {
      set({ isJoiningRoom: true, error: null });
      const response = await roomAPI.joinRoom(roomCode);
      
      if (response.success) {
        const room = response.data.room;
        
        set({
          currentRoom: room,
          isJoiningRoom: false,
        });

        toast.success('Joined room successfully!');
        return { success: true, room };
      }
    } catch (error) {
      set({ 
        isJoiningRoom: false, 
        error: error.message 
      });
      toast.error(error.message || 'Failed to join room');
      return { success: false, error: error.message };
    }
  },

  leaveRoom: async (roomId) => {
    try {
      set({ isLoading: true });
      const response = await roomAPI.leaveRoom(roomId);
      
      if (response.success) {
        set({
          currentRoom: null,
          participants: [],
          isLoading: false,
        });

        toast.success('Left room successfully');
        return { success: true };
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message 
      });
      toast.error(error.message || 'Failed to leave room');
      return { success: false, error: error.message };
    }
  },

  getRoomByCode: async (roomCode) => {
    try {
      set({ isLoading: true, error: null });
      const response = await roomAPI.getRoomByCode(roomCode);
      
      if (response.success) {
        const room = response.data.room;
        
        set({
          currentRoom: room,
          isLoading: false,
        });

        return { success: true, room };
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  },

  getRoomParticipants: async (roomId) => {
    try {
      const response = await roomAPI.getRoomParticipants(roomId);
      
      if (response.success) {
        const participants = response.data.participants;
        
        set({ participants });
        return { success: true, participants };
      }
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  getUserRooms: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await roomAPI.getUserRooms();
      
      if (response.success) {
        const rooms = response.data.rooms;
        
        set({
          rooms,
          isLoading: false,
        });

        return { success: true, rooms };
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message 
      });
      return { success: false, error: error.message };
    }
  },

  updateRoomStatus: async (roomId, isActive) => {
    try {
      set({ isLoading: true });
      const response = await roomAPI.updateRoomStatus(roomId, { is_active: isActive });
      
      if (response.success) {
        const updatedRoom = response.data.room;
        
        set(state => ({
          currentRoom: state.currentRoom?.id === roomId ? updatedRoom : state.currentRoom,
          rooms: state.rooms.map(room => 
            room.id === roomId ? updatedRoom : room
          ),
          isLoading: false,
        }));

        toast.success(`Room ${isActive ? 'activated' : 'deactivated'} successfully`);
        return { success: true };
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message 
      });
      toast.error(error.message || 'Failed to update room status');
      return { success: false, error: error.message };
    }
  },

  // Socket event handlers
  setParticipants: (participants) => set({ participants }),
  
  addParticipant: (participant) => set(state => ({
    participants: [...state.participants, participant]
  })),
  
  removeParticipant: (userId) => set(state => ({
    participants: state.participants.filter(p => p.user_id !== userId)
  })),

  // Clear current room
  clearCurrentRoom: () => set({
    currentRoom: null,
    participants: [],
    error: null,
  }),

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    currentRoom: null,
    participants: [],
    rooms: [],
    isLoading: false,
    isJoiningRoom: false,
    error: null,
  }),
}));

export { useRoomStore };
