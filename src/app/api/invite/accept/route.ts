import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDbSync } from '@/lib/db';
import { invitations, projectMembers, projects } from '@/lib/db/schema/sqlite';
import { eq, and, gt } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const db = getDbSync();

    // 查找有效的邀请
    const invitation = await db
      .select()
      .from(invitations)
      .where(and(eq(invitations.token, token), gt(invitations.expiresAt, new Date())))
      .get();

    if (!invitation) {
      return NextResponse.json({ error: '邀请无效或已过期' }, { status: 400 });
    }

    // 获取项目信息（为了返回 identify）
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, invitation.projectId))
      .get();

    if (!project) {
      return NextResponse.json({ error: '项目已不存在' }, { status: 404 });
    }

    // 检查是否已经是成员
    const existingMember = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, invitation.projectId), eq(projectMembers.userId, currentUser.userId)))
      .get();

    if (existingMember) {
      // 如果已是成员，直接返回成功及项目标识
      return NextResponse.json({ success: true, identify: project.identify });
    }

    // 添加到项目成员
    await db.insert(projectMembers).values({
      id: randomUUID(),
      projectId: invitation.projectId,
      userId: currentUser.userId,
      role: invitation.role as 'owner' | 'editor' | 'viewer',
    }).run();

    // 删除已使用的邀请
    await db.delete(invitations).where(eq(invitations.id, invitation.id)).run();

    return NextResponse.json({
      success: true,
      message: '已成功加入项目',
      identify: project.identify,
    });
  } catch (error: any) {
    console.error('接受邀请错误:', error);
    return NextResponse.json({ error: error.message || '操作失败' }, { status: 500 });
  }
}
