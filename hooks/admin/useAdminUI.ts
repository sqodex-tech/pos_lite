import { create } from 'zustand';

interface AdminUIState {
  isMobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const useAdminUI = create<AdminUIState>((set) => ({
  isMobileSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  closeSidebar: () => set({ isMobileSidebarOpen: false }),
}));
