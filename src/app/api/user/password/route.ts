import { NextRequest, NextResponse } from 'next/server';
import {  getDbSync , getSchema } from '@/lib/db';

import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// 修改密码
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
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: '请提供旧密码和新密码' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码长度至少为 6 位' },
        { status: 400 }
      );
    }

    const db = getDbSync(); const schema = getSchema();

    // 获取当前用户密码
    const userList = await db
      .select({
        id: (schema.users as any).id,
        password: (schema.users as any).password,
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

    // 检查用户是否有密码（第三方登录用户可能没有）
    if (!user.password) {
      return NextResponse.json(
        { error: '您的账户使用第三方登录，无法通过此方式修改密码' },
        { status: 400 }
      );
    }

    // 验证旧密码
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: '旧密码错误' },
        { status: 400 }
      );
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await db.update(schema.users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq((schema.users as any).id, tokenPayload.userId))
      ;

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
