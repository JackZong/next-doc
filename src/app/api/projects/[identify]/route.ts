import { NextRequest, NextResponse } from 'next/server';
import {  getDbSync , getSchema } from '@/lib/db';

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
    const db = getDbSync(); const schema = getSchema();

    // 获取项目
    const projectList = await db
      .select({
        id: (schema.projects as any).id,
        name: (schema.projects as any).name,
        identify: (schema.projects as any).identify,
        description: (schema.projects as any).description,
        cover: (schema.projects as any).cover,
        logo: (schema.projects as any).logo,
        favicon: (schema.projects as any).favicon,
        visibility: (schema.projects as any).visibility,
        accessToken: (schema.projects as any).accessToken,
        editorType: (schema.projects as any).editorType,
        ownerId: (schema.projects as any).ownerId,
        ownerName: (schema.users as any).name,
        createdAt: (schema.projects as any).createdAt,
        updatedAt: (schema.projects as any).updatedAt,
      })
      .from(schema.projects)
      .leftJoin(schema.users, eq((schema.projects as any).ownerId, (schema.users as any).id))
      .where(eq((schema.projects as any).identify, identify))
      .limit(1);
    const project = projectList[0];

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
      const membershipList = await db
        .select()
        .from(schema.projectMembers)
        .where(
          and(
            eq((schema.projectMembers as any).projectId, project.id),
            eq((schema.projectMembers as any).userId, tokenPayload.userId)
          )
        )
        .limit(1);
    const membership = membershipList[0];

      if (!membership && project.ownerId !== tokenPayload.userId) {
        return NextResponse.json(
          { error: '您没有访问该项目的权限' },
          { status: 403 }
        );
      }
    }

    // 获取文档数量
    const docCountList = await db
      .select({ count: count() })
      .from(schema.documents)
      .where(eq((schema.documents as any).projectId, project.id))
      .limit(1);
    const docCount = docCountList[0];

    // 获取成员数量
    const memberCountList = await db
      .select({ count: count() })
      .from(schema.projectMembers)
      .where(eq((schema.projectMembers as any).projectId, project.id))
      .limit(1);
    const memberCount = memberCountList[0];

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

    const db = getDbSync(); const schema = getSchema();

    // 获取项目
    const projectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).identify, identify))
      .limit(1);
    const project = projectList[0];

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 权限检查
    const membershipList = await db
      .select()
      .from(schema.projectMembers)
      .where(
        and(
          eq((schema.projectMembers as any).projectId, project.id),
          eq((schema.projectMembers as any).userId, tokenPayload.userId)
        )
      )
      .limit(1);
    const membership = membershipList[0];

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
    await db.update(schema.projects)
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
      .where(eq((schema.projects as any).id, project.id))
      ;

    const updatedProjectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).id, project.id))
      .limit(1);
    const updatedProject = updatedProjectList[0];

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

    const db = getDbSync(); const schema = getSchema();

    // 获取项目
    const projectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).identify, identify))
      .limit(1);
    const project = projectList[0];

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
    await db.delete(schema.projects).where(eq((schema.projects as any).id, project.id));

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
