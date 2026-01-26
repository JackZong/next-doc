import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {  getDbSync, getSchema } from '@/lib/db';
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
    const schema = getSchema();
    const userList = await db
      .select({
        id: (schema.users as any).id,
        account: (schema.users as any).account,
        email: (schema.users as any).email,
        name: (schema.users as any).name,
        avatar: (schema.users as any).avatar,
        image: (schema.users as any).image,
        role: (schema.users as any).role,
      })
      .from(schema.users)
      .where(eq((schema.users as any).id, tokenPayload.userId))
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
