import { NextRequest, NextResponse } from 'next/server';
import { getDbSync } from '@/lib/db';
import { projects, projectMembers, users, documents } from '@/lib/db/schema/sqlite';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, count } from 'drizzle-orm';

// 获取项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identify: string }> }
) {
  try {
    const { identify } = await params;
    const tokenPayload = await getCurrentUser();
    const db = getDbSync();

    // 获取项目
    const project = await db
      .select({
        id: projects.id,
        name: projects.name,
        identify: projects.identify,
        description: projects.description,
        cover: projects.cover,
        logo: projects.logo,
        favicon: projects.favicon,
        visibility: projects.visibility,
        accessToken: projects.accessToken,
        editorType: projects.editorType,
        ownerId: projects.ownerId,
        ownerName: users.name,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .where(eq(projects.identify, identify))
      .get();

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 权限检查
    if (project.visibility === 'private') {
      if (!tokenPayload) {
        return NextResponse.json(
          { error: '该项目为私有项目，请先登录' },
          { status: 401 }
        );
      }

      // 检查是否是项目成员
      const membership = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, project.id),
            eq(projectMembers.userId, tokenPayload.userId)
          )
        )
        .get();

      if (!membership && project.ownerId !== tokenPayload.userId) {
        return NextResponse.json(
          { error: '您没有访问该项目的权限' },
          { status: 403 }
        );
      }
    }

    // 获取文档数量
    const docCount = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.projectId, project.id))
      .get();

    // 获取成员数量
    const memberCount = await db
      .select({ count: count() })
      .from(projectMembers)
      .where(eq(projectMembers.projectId, project.id))
      .get();

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        documentCount: docCount?.count || 0,
        memberCount: memberCount?.count || 0,
      },
    });
  } catch (error) {
    console.error('获取项目详情错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ identify: string }> }
) {
  try {
    const { identify } = await params;
    const tokenPayload = await getCurrentUser();

    if (!tokenPayload) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const db = getDbSync();

    // 获取项目
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.identify, identify))
      .get();

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 权限检查
    const membership = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, project.id),
          eq(projectMembers.userId, tokenPayload.userId)
        )
      )
      .get();

    const canEdit = 
      project.ownerId === tokenPayload.userId ||
      membership?.role === 'owner' ||
      membership?.role === 'editor' ||
      tokenPayload.role === 'admin';

    if (!canEdit) {
      return NextResponse.json(
        { error: '您没有编辑该项目的权限' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, visibility, password, cover, logo, favicon, accessToken, editorType } = body;

    // 更新项目
    await db.update(projects)
      .set({
        name: name || project.name,
        description: description !== undefined ? description : project.description,
        visibility: visibility || project.visibility,
        password: visibility === 'password' ? password : null,
        accessToken: visibility === 'token' ? (accessToken || project.accessToken) : null,
        cover: cover !== undefined ? cover : project.cover,
        logo: logo !== undefined ? logo : project.logo,
        favicon: favicon !== undefined ? favicon : project.favicon,
        editorType: editorType !== undefined ? editorType : project.editorType,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id))
      .run();

    const updatedProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, project.id))
      .get();

    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    console.error('更新项目错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ identify: string }> }
) {
  try {
    const { identify } = await params;
    const tokenPayload = await getCurrentUser();

    if (!tokenPayload) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const db = getDbSync();

    // 获取项目
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.identify, identify))
      .get();

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 只有所有者或管理员可以删除
    if (project.ownerId !== tokenPayload.userId && tokenPayload.role !== 'admin') {
      return NextResponse.json(
        { error: '只有项目所有者可以删除项目' },
        { status: 403 }
      );
    }

    // 删除项目（级联删除会处理相关数据）
    await db.delete(projects).where(eq(projects.id, project.id)).run();

    return NextResponse.json({
      success: true,
      message: '项目已删除',
    });
  } catch (error) {
    console.error('删除项目错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
