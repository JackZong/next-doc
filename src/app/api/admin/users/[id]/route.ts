import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {  getDbSync , getSchema } from '@/lib/db';

import { eq } from 'drizzle-orm';

// 更新用户信息（角色、状态等）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    // 权限验证
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role, status } = body;

    const db = getDbSync(); const schema = getSchema();

    // 检查用户是否存在
    const userList = await db
      .select()
      .from(schema.users)
      .where(eq((schema.users as any).id, id))
      .limit(1);
    const user = userList[0];

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 不能修改自己的角色
    if (id === currentUser.userId && role) {
      return NextResponse.json(
        { error: '不能修改自己的角色' },
        { status: 400 }
      );
    }

    // 更新用户
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (role) updateData.role = role;
    if (status) updateData.status = status;

    await db
      .update(schema.users)
      .set(updateData)
      .where(eq((schema.users as any).id, id))
      ;

    return NextResponse.json({
      success: true,
      message: '用户信息已更新',
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    // 权限验证
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }

    // 不能删除自己
    if (id === currentUser.userId) {
      return NextResponse.json(
        { error: '不能删除自己的账号' },
        { status: 400 }
      );
    }

    const db = getDbSync(); const schema = getSchema();

    // 检查用户是否存在
    const userList = await db
      .select()
      .from(schema.users)
      .where(eq((schema.users as any).id, id))
      .limit(1);
    const user = userList[0];

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 删除用户
    await db
      .delete(schema.users)
      .where(eq((schema.users as any).id, id))
      ;

    return NextResponse.json({
      success: true,
      message: '用户已删除',
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
