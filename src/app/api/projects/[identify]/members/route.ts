import { NextRequest, NextResponse } from 'next/server';
import { getDb, getDatabaseType, sqliteSchema } from '@/lib/db';
import { projects, projectMembers, users } from '@/lib/db/schema/sqlite';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { randomUUID } from 'crypto';

// 获取项目成员列表
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ identify: string }> }
) {
  try {
    const { identify } = await params;
    const db = await getDb();
    const dbType = getDatabaseType();

    if (dbType === 'sqlite') {
      const sqliteDb = db as LibSQLDatabase<typeof sqliteSchema>;

      // 获取项目
      const project = await sqliteDb
        .select()
        .from(projects)
        .where(eq(projects.identify, identify))
        .get();

      if (!project) {
        return NextResponse.json({ error: '项目不存在' }, { status: 404 });
      }

      // 获取成员
      const members = await sqliteDb
        .select({
          id: projectMembers.id,
          userId: projectMembers.userId,
          role: projectMembers.role,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          joinedAt: projectMembers.createdAt,
        })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, project.id))
        .all();

      return NextResponse.json({
        success: true,
        members: members || [],
      });
    }

    return NextResponse.json({ success: true, members: [] });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 添加项目成员
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ identify: string }> }
) {
  try {
    const { identify } = await params;
    const tokenPayload = await getCurrentUser();

    if (!tokenPayload) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { email, role = 'editor' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '请输入用户邮箱' }, { status: 400 });
    }

    const db = await getDb();
    const dbType = getDatabaseType();

    if (dbType === 'sqlite') {
      const sqliteDb = db as LibSQLDatabase<typeof sqliteSchema>;

      // 获取项目
      const project = await sqliteDb
        .select()
        .from(projects)
        .where(eq(projects.identify, identify))
        .get();

      if (!project) {
        return NextResponse.json({ error: '项目不存在' }, { status: 404 });
      }

      // 权限检查
      if (project.ownerId !== tokenPayload.userId && tokenPayload.role !== 'admin') {
        return NextResponse.json({ error: '无权操作' }, { status: 403 });
      }

      // 查找用户
      const userToAdd = await sqliteDb
        .select()
        .from(users)
        .where(eq(users.email, email))
        .get();

      if (!userToAdd) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }

      // 检查是否已经是成员
      const existingMember = await sqliteDb
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, project.id),
            eq(projectMembers.userId, userToAdd.id)
          )
        )
        .get();

      if (existingMember) {
        return NextResponse.json({ error: '该用户已经是项目成员' }, { status: 400 });
      }

      // 添加成员
      await sqliteDb.insert(projectMembers).values({
        id: randomUUID(),
        projectId: project.id,
        userId: userToAdd.id,
        role: role as 'editor' | 'viewer',
      }).run();
    }

    return NextResponse.json({
      success: true,
      message: '成员添加成功',
    });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
