import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDbSync, getSchema } from '@/lib/db';
import { desc, eq, count } from 'drizzle-orm';

// 获取所有项目列表
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

    const db = getDbSync() as any;
    const schema = getSchema();

    // 获取所有项目及其所有者信息
    const projectList = await db
      .select({
        id: (schema.projects as any).id,
        name: (schema.projects as any).name,
        identify: (schema.projects as any).identify,
        description: (schema.projects as any).description,
        visibility: (schema.projects as any).visibility,
        ownerId: (schema.projects as any).ownerId,
        ownerName: (schema.users as any).name,
        createdAt: (schema.projects as any).createdAt,
      })
      .from(schema.projects)
      .leftJoin(schema.users, eq((schema.projects as any).ownerId, (schema.users as any).id))
      .orderBy(desc((schema.projects as any).createdAt));

    // 为每个项目获取文档数和成员数
    const projectsWithCounts = await Promise.all(
      projectList.map(async (project: any) => {
        // 获取文档数
        const docCountList = await db
          .select({ count: count() })
          .from(schema.documents)
          .where(eq((schema.documents as any).projectId, project.id));
        
        const docCount = docCountList[0];

        // 获取成员数
        const memberCountList = await db
          .select({ count: count() })
          .from(schema.projectMembers)
          .where(eq((schema.projectMembers as any).projectId, project.id));
        
        const memberCount = memberCountList[0];

        return {
          ...project,
          documentCount: docCount?.count || 0,
          memberCount: memberCount?.count || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      projects: projectsWithCounts,
    });
  } catch (error) {
    console.error('获取项目列表错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
