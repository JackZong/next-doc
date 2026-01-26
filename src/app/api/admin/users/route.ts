import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {  getDbSync, getSchema } from '@/lib/db';
import { desc } from 'drizzle-orm';

// 获取所有用户列表
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    // 权限验证
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const db = getDbSync(); const schema = getSchema();

    const userList = await db
      .select({
        id: (schema.users as any).id,
        account: (schema.users as any).account,
        name: (schema.users as any).name,
        email: (schema.users as any).email,
        role: (schema.users as any).role,
        status: (schema.users as any).status,
        avatar: (schema.users as any).avatar,
        createdAt: (schema.users as any).createdAt,
      })
      .from(schema.users)
      .orderBy(desc((schema.users as any).createdAt));

    return NextResponse.json({
      success: true,
      users: userList,
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

// 管理员创建用户
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // 权限验证
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { account, email, password, name, role } = body;

    // 参数验证
    if (!account || !email || !password || !name || !role) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 账号格式验证
    const accountRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!accountRegex.test(account)) {
      return NextResponse.json(
        { error: '账号只能包含 3-20 位字母、数字或下划线' },
        { status: 400 }
      );
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 密码长度验证
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少为 6 位' },
        { status: 400 }
      );
    }

    const db = getDbSync() as any;
    const schema = getSchema();
    
    // 检查账号是否已存在
    const existingUserAccountList = await db
      .select()
      .from(schema.users)
      .where(eq((schema.users as any).account, account))
      .limit(1);
    
    const existingUserAccount = existingUserAccountList[0];

    if (existingUserAccount) {
      return NextResponse.json(
        { error: '该账号已被使用' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUserEmailList = await db
      .select()
      .from(schema.users)
      .where(eq((schema.users as any).email, email))
      .limit(1);
      
    const existingUserEmail = existingUserEmailList[0];

    if (existingUserEmail) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const userId = uuid();
    await db.insert(schema.users).values({
      id: userId,
      account,
      email,
      password: hashedPassword,
      name,
      role: role as 'admin' | 'editor' | 'viewer',
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      message: '用户创建成功',
    });
  } catch (error) {
    console.error('管理员创建用户错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
