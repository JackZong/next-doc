import { NextRequest, NextResponse } from 'next/server';
import { getDbSync, getSchema } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// 获取项目成员列表
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ identify: string }> }
) {
  try {
    const { identify } = await params;
    const db = getDbSync() as any;
    const schema = getSchema();

    // 获取项目
    const projectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).identify, identify))
      .limit(1);
    
    const project = projectList[0];

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 获取成员
    const members = await db
      .select({
        id: (schema.projectMembers as any).id,
        userId: (schema.projectMembers as any).userId,
        role: (schema.projectMembers as any).role,
        name: (schema.users as any).name,
        email: (schema.users as any).email,
        avatar: (schema.users as any).avatar,
        joinedAt: (schema.projectMembers as any).createdAt,
      })
      .from(schema.projectMembers)
      .innerJoin(schema.users, eq((schema.projectMembers as any).userId, (schema.users as any).id))
      .where(eq((schema.projectMembers as any).projectId, project.id));

    return NextResponse.json({
      success: true,
      members: members || [],
    });
  } catch (error) {
    console.error('获取成员列表错误:', error);
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

    const db = getDbSync() as any;
    const schema = getSchema();

    // 获取项目
    const projectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).identify, identify))
      .limit(1);
    
    const project = projectList[0];

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 权限检查
    if (project.ownerId !== tokenPayload.userId && tokenPayload.role !== 'admin') {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }

    // 查找用户
    const userToAddList = await db
      .select()
      .from(schema.users)
      .where(eq((schema.users as any).email, email))
      .limit(1);
    
    const userToAdd = userToAddList[0];

    if (!userToAdd) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 检查是否已经是成员
    const existingMemberList = await db
      .select()
      .from(schema.projectMembers)
      .where(
        and(
          eq((schema.projectMembers as any).projectId, project.id),
          eq((schema.projectMembers as any).userId, userToAdd.id)
        )
      )
      .limit(1);
    
    const existingMember = existingMemberList[0];

    if (existingMember) {
      return NextResponse.json({ error: '该用户已经是项目成员' }, { status: 400 });
    }

    // 添加成员
    await db.insert(schema.projectMembers).values({
      id: randomUUID(),
      projectId: project.id,
      userId: userToAdd.id,
      role: role as 'editor' | 'viewer',
    });

    return NextResponse.json({
      success: true,
      message: '成员添加成功',
    });
  } catch (error) {
    console.error('添加成员错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
