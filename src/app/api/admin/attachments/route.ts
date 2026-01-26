import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDbSync } from '@/lib/db';
import { attachments, projects, users } from '@/lib/db/schema/sqlite';
import { desc, eq } from 'drizzle-orm';

// 获取所有附件列表
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

    const db = getDbSync();

    // 获取所有附件及其关联信息
    const attachmentList = await db
      .select({
        id: attachments.id,
        name: attachments.name,
        path: attachments.path,
        size: attachments.size,
        mimeType: attachments.mimeType,
        projectId: attachments.projectId,
        projectName: projects.name,
        uploaderId: attachments.uploaderId,
        uploaderName: users.name,
        createdAt: attachments.createdAt,
      })
      .from(attachments)
      .leftJoin(projects, eq(attachments.projectId, projects.id))
      .leftJoin(users, eq(attachments.uploaderId, users.id))
      .orderBy(desc(attachments.createdAt))
      .all();

    return NextResponse.json({
      success: true,
      attachments: attachmentList,
    });
  } catch (error) {
    console.error('获取附件列表错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
