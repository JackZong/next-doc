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
      // 获取当前 store 中的状态
      // 由于 useUserStore 使用了 persist 中间件，刷新页面后 isAuthenticated 会保留上一次的状态
      const { isAuthenticated } = useUserStore.getState();
      
      // 如果本地记录显示未登录，则不发送请求
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

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
