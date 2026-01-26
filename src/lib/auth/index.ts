import { headers } from 'next/headers';
import { auth } from './better-auth';

// Token 载荷类型 (保持原有结构，为了兼容业务逻辑)
export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string | null;
}

/**
 * 从 Better Auth 获取当前会话并转换为基础载荷
 * 该函数用于服务器组件及 API 路由中判断登录状态
 */
export async function getCurrentUser(): Promise<TokenPayload | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (session && session.user) {
      return {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role || 'viewer',
        avatar: (session.user as any).image || (session.user as any).avatar
      };
    }
  } catch (error) {
    console.error('Better Auth 获取会话失败:', error);
  }

  return null;
}

// 检查用户是否为管理员
export function isAdmin(user: TokenPayload | null): boolean {
  return user?.role === 'admin';
}

// 检查用户是否有编辑权限
export function canEdit(user: TokenPayload | null): boolean {
  return user?.role === 'admin' || user?.role === 'editor';
}
