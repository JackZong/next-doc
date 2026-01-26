import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import {  getDbSync , getSchema } from '@/lib/db';

import { getCurrentUser } from '@/lib/auth';
import { eq, and, desc, count } from 'drizzle-orm';

// 获取文档详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDbSync(); const schema = getSchema();

    // 获取文档
    const docList = await db
      .select({
        id: (schema.documents as any).id,
        projectId: (schema.documents as any).projectId,
        parentId: (schema.documents as any).parentId,
        title: (schema.documents as any).title,
        identify: (schema.documents as any).identify,
        content: (schema.documents as any).content,
        contentType: (schema.documents as any).contentType,
        sort: (schema.documents as any).sort,
        status: (schema.documents as any).status,
        authorId: (schema.documents as any).authorId,
        authorName: (schema.users as any).name,
        viewCount: (schema.documents as any).viewCount,
        createdAt: (schema.documents as any).createdAt,
        updatedAt: (schema.documents as any).updatedAt,
      })
      .from(schema.documents)
      .leftJoin(schema.users, eq((schema.documents as any).authorId, (schema.users as any).id))
      .where(eq((schema.documents as any).id, id))
      .limit(1);
    const doc = docList[0];

    if (!doc) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }

    // 获取项目信息
    const projectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).id, doc.projectId))
      .limit(1);
    const project = projectList[0];

    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }

    // 权限检查
    const tokenPayload = await getCurrentUser();
    if (project.visibility === 'private') {
      if (!tokenPayload) {
        return NextResponse.json(
          { error: '请先登录' },
          { status: 401 }
        );
      }

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
          { error: '无权访问该文档' },
          { status: 403 }
        );
      }
    }

    // 更新浏览次数
    await db.update(schema.documents)
      .set({ viewCount: doc.viewCount + 1 })
      .where(eq((schema.documents as any).id, id))
      ;

    return NextResponse.json({
      success: true,
      document: doc,
      project: {
        id: project.id,
        name: project.name,
        identify: project.identify,
        editorType: (project as { editorType?: string }).editorType || 'markdown',
      },
    });
  } catch (error) {
    console.error('获取文档详情错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 更新文档
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenPayload = await getCurrentUser();

    if (!tokenPayload) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const db = getDbSync(); const schema = getSchema();

    // 获取文档
    const docList = await db
      .select()
      .from(schema.documents)
      .where(eq((schema.documents as any).id, id))
      .limit(1);
    const doc = docList[0];

    if (!doc) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }

    // 获取项目
    const projectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).id, doc.projectId))
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
        { error: '无权编辑该文档' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, contentType, status, parentId, sort } = body;

    // 保存历史版本
    if (content && content !== doc.content) {
      const historyCountList = await db
        .select({ count: count() })
        .from(schema.documentHistory)
        .where(eq((schema.documentHistory as any).documentId, id))
        .limit(1);
    const historyCount = historyCountList[0];

      await db.insert(schema.documentHistory).values({
        id: uuid(),
        documentId: id,
        content: doc.content,
        version: (historyCount?.count || 0) + 1,
        authorId: tokenPayload.userId,
      });
    }

    // 更新文档
    await db.update(schema.documents)
      .set({
        title: title !== undefined ? title : doc.title,
        content: content !== undefined ? content : doc.content,
        contentType: contentType !== undefined ? contentType : doc.contentType,
        status: status !== undefined ? status : doc.status,
        parentId: parentId !== undefined ? parentId : doc.parentId,
        sort: sort !== undefined ? sort : doc.sort,
        updatedAt: new Date(),
      })
      .where(eq((schema.documents as any).id, id))
      ;

    const updatedDocList = await db
      .select()
      .from(schema.documents)
      .where(eq((schema.documents as any).id, id))
      .limit(1);
    const updatedDoc = updatedDocList[0];

    return NextResponse.json({
      success: true,
      document: updatedDoc,
    });
  } catch (error) {
    console.error('更新文档错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 删除文档
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenPayload = await getCurrentUser();

    if (!tokenPayload) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    const db = getDbSync(); const schema = getSchema();

    // 获取文档
    const docList = await db
      .select()
      .from(schema.documents)
      .where(eq((schema.documents as any).id, id))
      .limit(1);
    const doc = docList[0];

    if (!doc) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      );
    }

    // 获取项目
    const projectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).id, doc.projectId))
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

    const canDelete = 
      project.ownerId === tokenPayload.userId ||
      membership?.role === 'owner' ||
      membership?.role === 'editor' ||
      tokenPayload.role === 'admin';

    if (!canDelete) {
      return NextResponse.json(
        { error: '无权删除该文档' },
        { status: 403 }
      );
    }

    // 删除文档（级联删除子文档和历史）
    await db.delete(schema.documents).where(eq((schema.documents as any).id, id));

    return NextResponse.json({
      success: true,
      message: '文档已删除',
    });
  } catch (error) {
    console.error('删除文档错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
