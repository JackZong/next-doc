import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDbSync, getSchema } from '@/lib/db';
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

    const db = getDbSync() as any;
    const schema = getSchema();

    // 1. 统计总项目数
    const projectCountList = await db
      .select({ count: count() })
      .from(schema.projects);
    const projectCount = projectCountList[0];

    // 2. 统计总用户数
    const userCountList = await db
      .select({ count: count() })
      .from(schema.users);
    const userCount = userCountList[0];

    // 3. 统计总附件数
    const attachmentCountList = await db
      .select({ count: count() })
      .from(schema.attachments);
    const attachmentCount = attachmentCountList[0];

    // 4. 统计活跃用户数（状态为active的用户）
    const activeUserCountList = await db
      .select({ count: count() })
      .from(schema.users)
      .where(eq((schema.users as any).status, 'active'));
    const activeUserCount = activeUserCountList[0];

    // 5. 获取最近创建的项目（最近5个）
    const recentProjects = await db
      .select({
        id: (schema.projects as any).id,
        name: (schema.projects as any).name,
        identify: (schema.projects as any).identify,
        visibility: (schema.projects as any).visibility,
        createdAt: (schema.projects as any).createdAt,
        ownerName: (schema.users as any).name,
      })
      .from(schema.projects)
      .leftJoin(schema.users, eq((schema.projects as any).ownerId, (schema.users as any).id))
      .orderBy(desc((schema.projects as any).createdAt))
      .limit(5);

    // 6. 获取最近注册的用户（最近5个）
    const recentUsers = await db
      .select({
        id: (schema.users as any).id,
        name: (schema.users as any).name,
        email: (schema.users as any).email,
        role: (schema.users as any).role,
        createdAt: (schema.users as any).createdAt,
      })
      .from(schema.users)
      .orderBy(desc((schema.users as any).createdAt))
      .limit(5);

    // 7. 统计各角色用户数
    const roleStats = await db
      .select({
        role: (schema.users as any).role,
        count: count(),
      })
      .from(schema.users)
      .groupBy((schema.users as any).role);

    // 8. 统计各可见性项目数
    const visibilityStats = await db
      .select({
        visibility: (schema.projects as any).visibility,
        count: count(),
      })
      .from(schema.projects)
      .groupBy((schema.projects as any).visibility);

    return NextResponse.json({
      success: true,
      stats: {
        totalProjects: projectCount?.count || 0,
        totalUsers: userCount?.count || 0,
        totalAttachments: attachmentCount?.count || 0,
        activeUsers: activeUserCount?.count || 0,
        roleStats: roleStats.reduce((acc: any, item: any) => {
          acc[item.role] = item.count;
          return acc;
        }, {} as Record<string, number>),
        visibilityStats: visibilityStats.reduce((acc: any, item: any) => {
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
