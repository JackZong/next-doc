import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {  getDbSync , getSchema } from '@/lib/db';

import { eq, and, gt } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const db = getDbSync(); const schema = getSchema();

    // 查找有效的邀请
    const invitationList = await db
      .select()
      .from(schema.invitations)
      .where(and(eq((schema.invitations as any).token, token), gt((schema.invitations as any).expiresAt, new Date())))
      .limit(1);
    const invitation = invitationList[0];

    if (!invitation) {
      return NextResponse.json({ error: '邀请无效或已过期' }, { status: 400 });
    }

    // 获取项目信息（为了返回 identify）
    const projectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).id, invitation.projectId))
      .limit(1);
    const project = projectList[0];

    if (!project) {
      return NextResponse.json({ error: '项目已不存在' }, { status: 404 });
    }

    // 检查是否已经是成员
    const existingMemberList = await db
      .select()
      .from(schema.projectMembers)
      .where(and(eq((schema.projectMembers as any).projectId, invitation.projectId), eq((schema.projectMembers as any).userId, currentUser.userId)))
      .limit(1);
    const existingMember = existingMemberList[0];

    if (existingMember) {
      // 如果已是成员，直接返回成功及项目标识
      return NextResponse.json({ success: true, identify: project.identify });
    }

    // 添加到项目成员
    await db.insert(schema.projectMembers).values({
      id: randomUUID(),
      projectId: invitation.projectId,
      userId: currentUser.userId,
      role: invitation.role as 'owner' | 'editor' | 'viewer',
    });

    // 删除已使用的邀请
    await db.delete(schema.invitations).where(eq((schema.invitations as any).id, invitation.id));

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
