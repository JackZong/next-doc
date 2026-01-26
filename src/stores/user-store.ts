import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 用户信息类型
export interface UserInfo {
  id: string;
  email: string;
  name: string;
  account: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer';
}

// 用户状态类型
interface UserState {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: UserInfo | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: UserInfo) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserInfo>) => void;
}

// 用户状态 Store
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),

      setLoading: (isLoading) => set({ isLoading }),

      login: (user) => set({ 
        user, 
        isAuthenticated: true,
        isLoading: false 
      }),

      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      }),

      updateProfile: (data) => set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
      })),
    }),
    {
      name: 'next-doc-user',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 获取当前用户（便捷方法）
export const getCurrentUserFromStore = () => useUserStore.getState().user;
