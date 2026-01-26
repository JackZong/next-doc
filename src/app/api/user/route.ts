import { NextRequest, NextResponse } from 'next/server';
import {  getDbSync , getSchema } from '@/lib/db';

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

    const db = getDbSync(); const schema = getSchema();

    // 检查邮箱是否被其他用户占用
    const existingEmailList = await db
      .select()
      .from(schema.users)
      .where(
        and(
            eq((schema.users as any).email, email),
            ne((schema.users as any).id, tokenPayload.userId)
        )
      )
      .limit(1);
    const existingEmail = existingEmailList[0];

    if (existingEmail) {
      return NextResponse.json(
        { error: '该邮箱已被使用' },
        { status: 400 }
      );
    }

    // 检查账号是否被其他用户占用
    const existingAccountList = await db
        .select()
        .from(schema.users)
        .where(
            and(
                eq((schema.users as any).account, account),
                ne((schema.users as any).id, tokenPayload.userId)
            )
        )
        .limit(1);
    const existingAccount = existingAccountList[0];

    if (existingAccount) {
        return NextResponse.json(
            { error: '该用户名已被使用' },
            { status: 400 }
        );
    }

    // 更新用户
    await db.update(schema.users)
      .set({
        name,
        email,
        account,
        avatar: avatar || null,
        updatedAt: new Date(),
      })
      .where(eq((schema.users as any).id, tokenPayload.userId))
      ;

    const updatedUserList = await db
      .select({
        id: (schema.users as any).id,
        account: (schema.users as any).account,
        email: (schema.users as any).email,
        name: (schema.users as any).name,
        avatar: (schema.users as any).avatar,
        role: (schema.users as any).role,
        status: (schema.users as any).status,
      })
      .from(schema.users)
      .where(eq((schema.users as any).id, tokenPayload.userId))
      .limit(1);
    const updatedUser = updatedUserList[0];

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
