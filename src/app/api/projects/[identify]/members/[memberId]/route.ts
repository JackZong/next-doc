import { NextRequest, NextResponse } from 'next/server';
import { getDb, getDatabaseType, sqliteSchema } from '@/lib/db';
import { projectMembers, projects } from '@/lib/db/schema/sqlite';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';

// 更新或删除项目成员
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ identify: string; memberId: string }> }
) {
  try {
    const { memberId } = await params;

    const tokenPayload = await getCurrentUser();
    if (!tokenPayload) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const db = await getDb();
    const dbType = getDatabaseType();

    if (dbType === 'sqlite') {
      const sqliteDb = db as LibSQLDatabase<typeof sqliteSchema>;
      // 查找成员记录
      const memberRecord = await sqliteDb
        .select()
        .from(projectMembers)
        .where(eq(projectMembers.id, memberId))
        .get();

      if (!memberRecord) {
        return NextResponse.json({ error: '成员记录不存在' }, { status: 404 });
      }

      // 权限检查: 只有项目 owner 或系统管理员可以移除成员
      const project = await sqliteDb.select().from(projects).where(eq(projects.identify, (await params).identify)).get();
      const currentUserMembership = await sqliteDb.select().from(projectMembers)
        .where(and(eq(projectMembers.projectId, project?.id || ''), eq(projectMembers.userId, tokenPayload.userId)))
        .get();

      if (tokenPayload.role !== 'admin' && (!currentUserMembership || currentUserMembership.role !== 'owner')) {
        return NextResponse.json({ error: '权限不足' }, { status: 403 });
      }

      // 不能移除自己 (或者是最后一个 owner)
      if (memberRecord.userId === tokenPayload.userId) {
        return NextResponse.json({ error: '不能移除自己' }, { status: 400 });
      }

      await sqliteDb.delete(projectMembers).where(eq(projectMembers.id, memberId)).run();
    }

    return NextResponse.json({
      success: true,
      message: '成员已移除',
    });
  } catch (error) {
    console.error('移除成员错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ identify: string; memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { role } = await request.json();

    if (!role) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const tokenPayload = await getCurrentUser();
    if (!tokenPayload) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const db = await getDb();
    const dbType = getDatabaseType();

    if (dbType === 'sqlite') {
      const sqliteDb = db as LibSQLDatabase<typeof sqliteSchema>;
      await sqliteDb.update(projectMembers)
        .set({ role: role as 'editor' | 'viewer' })
        .where(eq(projectMembers.id, memberId));
    }

    return NextResponse.json({
      success: true,
      message: '成员角色已更新',
    });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
