import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getCurrentUser } from '@/lib/auth';
import { getDbSync } from '@/lib/db';
import { attachments, projects } from '@/lib/db/schema/sqlite';
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '不支持的文件类型，仅支持 JPG、PNG、GIF、WebP、SVG、ICO 格式' },
        { status: 400 }
      );
    }

    // 限制文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过 5MB' },
        { status: 400 }
      );
    }

    const db = getDbSync();
    // 获取项目 ID
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.identify, identify))
      .get();

    if (!project) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
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
      await db.insert(attachments).values({
        id: uuid(),
        name: file.name,
        path: publicUrl,
        size: file.size,
        mimeType: file.type,
        projectId: project.id,
        uploaderId: user.userId,
      }).run();
    } catch (dbError) {
      console.error('保存附件记录失败:', dbError);
      // 虽然数据库记录失败，但文件已经上传，仍然返回成功。
      // 或者根据业务逻辑决定是否报错。
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
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
  };
  return mimeToExt[mimeType] || '.png';
}
