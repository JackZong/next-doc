import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDbSync } from '@/lib/db';
import { projects } from '@/lib/db/schema/sqlite';
import { eq } from 'drizzle-orm';

// 删除项目
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

    const db = getDbSync();

    // 检查项目是否存在
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .get();

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 删除项目（级联删除会处理相关数据）
    await db
      .delete(projects)
      .where(eq(projects.id, id))
      .run();

    return NextResponse.json({
      success: true,
      message: '项目已删除',
    });
  } catch (error) {
    console.error('删除项目错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
