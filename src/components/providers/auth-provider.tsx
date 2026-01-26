'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/stores/user-store';

/**
 * 认证状态提供者
 * 在应用启动时自动从服务器获取用户信息并同步到客户端 store
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useUserStore();

  useEffect(() => {
    const syncUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('同步用户状态失败:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
