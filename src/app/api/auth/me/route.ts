import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDbSync } from '@/lib/db';
import { users } from '@/lib/db/schema/sqlite';
import { eq } from 'drizzle-orm';

// 获取当前登录用户信息
export async function GET() {
  try {
    const tokenPayload = await getCurrentUser();

    if (!tokenPayload) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 从数据库获取完整用户信息
    const db = getDbSync() as any;
    const userList = await db
      .select({
        id: users.id,
        account: users.account,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        image: users.image,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, tokenPayload.userId))
      .limit(1);
    
    const user = userList[0];

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        account: user.account || user.email,
        email: user.email,
        name: user.name,
        avatar: user.avatar || user.image,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
