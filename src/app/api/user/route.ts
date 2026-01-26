import { NextRequest, NextResponse } from 'next/server';
import { getDbSync } from '@/lib/db';
import { users } from '@/lib/db/schema/sqlite';
import { getCurrentUser } from '@/lib/auth';
import { eq, ne, and } from 'drizzle-orm';

// 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const tokenPayload = await getCurrentUser();

    if (!tokenPayload) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, avatar, account } = body;

    if (!name || !email || !account) {
      return NextResponse.json(
        { error: '用户名、邮箱和账号不能为空' },
        { status: 400 }
      );
    }

    const db = getDbSync();

    // 检查邮箱是否被其他用户占用
    const existingEmail = await db
      .select()
      .from(users)
      .where(
        and(
            eq(users.email, email),
            ne(users.id, tokenPayload.userId)
        )
      )
      .get();

    if (existingEmail) {
      return NextResponse.json(
        { error: '该邮箱已被使用' },
        { status: 400 }
      );
    }

    // 检查账号是否被其他用户占用
    const existingAccount = await db
        .select()
        .from(users)
        .where(
            and(
                eq(users.account, account),
                ne(users.id, tokenPayload.userId)
            )
        )
        .get();

    if (existingAccount) {
        return NextResponse.json(
            { error: '该用户名已被使用' },
            { status: 400 }
        );
    }

    // 更新用户
    await db.update(users)
      .set({
        name,
        email,
        account,
        avatar: avatar || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, tokenPayload.userId))
      .run();

    const updatedUser = await db
      .select({
        id: users.id,
        account: users.account,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, tokenPayload.userId))
      .get();

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
