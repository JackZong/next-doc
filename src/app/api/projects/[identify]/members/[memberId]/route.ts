import { NextRequest, NextResponse } from 'next/server';
import { getDbSync, getSchema } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

// 更新或删除项目成员
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ identify: string; memberId: string }> }
) {
  try {
    const { memberId, identify } = await params;

    const tokenPayload = await getCurrentUser();
    if (!tokenPayload) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const db = getDbSync() as any;
    const schema = getSchema();

    // 查找成员记录
    const memberRecordList = await db
      .select()
      .from(schema.projectMembers)
      .where(eq((schema.projectMembers as any).id, memberId))
      .limit(1);
    
    const memberRecord = memberRecordList[0];

    if (!memberRecord) {
      return NextResponse.json({ error: '成员记录不存在' }, { status: 404 });
    }

    // 权限检查: 只有项目 owner 或系统管理员可以移除成员
    const projectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).identify, identify))
      .limit(1);
    const project = projectList[0];

    const currentUserMembershipList = await db
      .select()
      .from(schema.projectMembers)
      .where(and(eq((schema.projectMembers as any).projectId, project?.id || ''), eq((schema.projectMembers as any).userId, tokenPayload.userId)))
      .limit(1);
    const currentUserMembership = currentUserMembershipList[0];

    if (tokenPayload.role !== 'admin' && (!currentUserMembership || currentUserMembership.role !== 'owner')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 不能移除自己 (或者是最后一个 owner)
    if (memberRecord.userId === tokenPayload.userId) {
      return NextResponse.json({ error: '不能移除自己' }, { status: 400 });
    }

    await db.delete(schema.projectMembers).where(eq((schema.projectMembers as any).id, memberId));

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

    const db = getDbSync() as any;
    const schema = getSchema();

    await db.update(schema.projectMembers)
      .set({ role: role as 'editor' | 'viewer' })
      .where(eq((schema.projectMembers as any).id, memberId));

    return NextResponse.json({
      success: true,
      message: '成员角色已更新',
    });
  } catch (error) {
    console.error('更新成员角色错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
