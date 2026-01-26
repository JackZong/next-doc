import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDbSync } from '@/lib/db';
import { projects, users, documents, projectMembers } from '@/lib/db/schema/sqlite';
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

    const db = getDbSync();

    // 获取所有项目及其所有者信息
    const projectList = await db
      .select({
        id: projects.id,
        name: projects.name,
        identify: projects.identify,
        description: projects.description,
        visibility: projects.visibility,
        ownerId: projects.ownerId,
        ownerName: users.name,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .orderBy(desc(projects.createdAt))
      .all();

    // 为每个项目获取文档数和成员数
    const projectsWithCounts = await Promise.all(
      projectList.map(async (project) => {
        // 获取文档数
        const docCount = await db
          .select({ count: count() })
          .from(documents)
          .where(eq(documents.projectId, project.id))
          .get();

        // 获取成员数
        const memberCount = await db
          .select({ count: count() })
          .from(projectMembers)
          .where(eq(projectMembers.projectId, project.id))
          .get();

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
