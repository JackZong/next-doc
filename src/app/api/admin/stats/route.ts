import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDbSync } from '@/lib/db';
import { users, projects, attachments } from '@/lib/db/schema/sqlite';
import { count, eq, desc } from 'drizzle-orm';

// 获取系统统计数据
export async function GET(request: NextRequest) {
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

    // 1. 统计总项目数
    const projectCount = await db
      .select({ count: count() })
      .from(projects)
      .get();

    // 2. 统计总用户数
    const userCount = await db
      .select({ count: count() })
      .from(users)
      .get();

    // 3. 统计总附件数
    const attachmentCount = await db
      .select({ count: count() })
      .from(attachments)
      .get();

    // 4. 统计活跃用户数（状态为active的用户）
    const activeUserCount = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.status, 'active'))
      .get();

    // 5. 获取最近创建的项目（最近5个）
    const recentProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        identify: projects.identify,
        visibility: projects.visibility,
        createdAt: projects.createdAt,
        ownerName: users.name,
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .orderBy(desc(projects.createdAt))
      .limit(5)
      .all();

    // 6. 获取最近注册的用户（最近5个）
    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5)
      .all();

    // 7. 统计各角色用户数
    const roleStats = await db
      .select({
        role: users.role,
        count: count(),
      })
      .from(users)
      .groupBy(users.role)
      .all();

    // 8. 统计各可见性项目数
    const visibilityStats = await db
      .select({
        visibility: projects.visibility,
        count: count(),
      })
      .from(projects)
      .groupBy(projects.visibility)
      .all();

    return NextResponse.json({
      success: true,
      stats: {
        totalProjects: projectCount?.count || 0,
        totalUsers: userCount?.count || 0,
        totalAttachments: attachmentCount?.count || 0,
        activeUsers: activeUserCount?.count || 0,
        roleStats: roleStats.reduce((acc, item) => {
          acc[item.role] = item.count;
          return acc;
        }, {} as Record<string, number>),
        visibilityStats: visibilityStats.reduce((acc, item) => {
          acc[item.visibility] = item.count;
          return acc;
        }, {} as Record<string, number>),
      },
      recentActivities: {
        projects: recentProjects,
        users: recentUsers,
      },
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
