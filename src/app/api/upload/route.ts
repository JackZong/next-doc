import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getCurrentUser } from '@/lib/auth';
import {  getDbSync , getSchema } from '@/lib/db';

import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

/**
 * 文件上传 API
 * 上传文件到 public/uploads/{identify}/ 目录
 * 
 * 请求参数:
 * - file: 上传的文件
 * - identify: 项目标识符（用于创建子目录）
 * - type: 文件类型（logo / favicon / image）
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const identify = formData.get('identify') as string;
    const type = formData.get('type') as string || 'image';

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到上传文件' },
        { status: 400 }
      );
    }

    if (!identify) {
      return NextResponse.json(
        { success: false, error: '缺少项目标识符' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const docTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-7z-compressed',
      'application/x-rar-compressed',
      'text/plain'
    ];
    
    const allowedTypes = [...imageTypes, ...videoTypes, ...docTypes];
    
    // 如果是附件类型，且不在 docTypes 中，也要允许（作为普通文件）
    // 这里为了安全，我们还是列出常见的，或者如果 type 为 'attachment' 则放宽限制
    if (type === 'attachment' && !allowedTypes.includes(file.type)) {
        // 如果是附件，放宽一些 MIME 限制，或者干脆只排除危险类型（如 .exe）
        const dangerousTypes = ['application/x-msdownload', 'application/x-sh', 'application/x-bat'];
        if (dangerousTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: '不支持上传危险文件类型' },
                { status: 400 }
            );
        }
    } else if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '不支持的文件类型' },
        { status: 400 }
      );
    }

    // 限制文件大小
    let maxSize = 5 * 1024 * 1024; // 默认 5MB
    if (videoTypes.includes(file.type)) {
      maxSize = 50 * 1024 * 1024; // 视频允许 50MB
    } else if (type === 'attachment') {
      maxSize = 20 * 1024 * 1024; // 附件允许 20MB
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `文件大小不能超过 ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    const db = getDbSync(); const schema = getSchema();
    // 获取项目 ID
    const projectList = await db
      .select()
      .from(schema.projects)
      .where(eq((schema.projects as any).identify, identify))
      .limit(1);
    const project = projectList[0];

    if (!project) {
      return NextResponse.json(
        { success: false, error: '项目 nonexistent' },
        { status: 404 }
      );
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', identify);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 生成文件名（类型_时间戳.扩展名）
    const ext = path.extname(file.name) || getExtensionFromMime(file.type);
    const timestamp = Date.now();
    const fileName = `${type}_${timestamp}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // 将文件写入磁盘
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 返回文件的公开访问路径
    const publicUrl = `/uploads/${identify}/${fileName}`;

    // 记录到附件表
    try {
      await db.insert(schema.attachments).values({
        id: uuid(),
        name: file.name,
        path: publicUrl,
        size: file.size,
        mimeType: file.type,
        projectId: project.id,
        uploaderId: user.userId,
      });
    } catch (dbError) {
      console.error('保存附件记录失败:', dbError);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      type,
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { success: false, error: '文件上传失败' },
      { status: 500 }
    );
  }
}

/**
 * 根据 MIME 类型获取文件扩展名
 */
function getExtensionFromMime(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/x-icon': '.ico',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogv',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'text/plain': '.txt',
  };
  return mimeToExt[mimeType] || '';
}
