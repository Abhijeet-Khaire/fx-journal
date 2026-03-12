import { create } from 'zustand';
import { Plan } from '@/lib/tradeTypes';

interface AppState {
  plan: Plan;
  setPlan: (plan: Plan) => void;
  dateRange: { from: Date | undefined; to?: Date | undefined } | undefined;
  setDateRange: (range: { from: Date | undefined; to?: Date | undefined } | undefined) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>((set) => ({
  plan: 'free',
  setPlan: (plan) => set({ plan }),
  dateRange: undefined,
  setDateRange: (dateRange) => set({ dateRange }),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
