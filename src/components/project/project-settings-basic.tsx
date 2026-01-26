'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Settings, Save, Trash2, Loader2, Upload, X, FileEdit, FileText, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { useProjectStore } from '@/stores/project-store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { generateAccessToken } from '@/lib/utils/token';

// 图片上传组件 - 点击即可选择并上传
function ImageUploader({
  label,
  value,
  onChange,
  identify,
  type,
  accept = 'image/*',
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  identify: string;
  type: 'logo' | 'favicon' | 'cover';
  accept?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 选择文件后立即上传
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('identify', identify);
      formData.append('type', type);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        onChange(data.url);
        toast.success(`${label}上传成功`);
      } else {
        toast.error(data.error || '上传失败');
      }
    } catch {
      toast.error('网络错误，上传失败');
    } finally {
      setIsUploading(false);
      // 重置 input，允许再次选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 清除已上传的图片
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发文件选择
    onChange('');
  };

  // 点击区域触发文件选择
  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-foreground/80">{label}</Label>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleUpload}
        className="hidden"
        id={`upload-${type}`}
      />
      {/* 可点击的预览区域 */}
      <div
        onClick={handleClick}
        className={`relative w-full h-24 rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-colors hover:bg-muted/50 hover:border-primary/50 ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">上传中...</span>
          </div>
        ) : value ? (
          <>
            <Image
              src={value}
              alt={label}
              fill
              className="object-contain p-2"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Upload className="w-6 h-6" />
            <span className="text-xs">点击选择图片</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectSettingsBasic({ identify }: { identify: string }) {
  const { currentProject, fetchProject, updateProject } = useProjectStore();
  const router = useRouter();
  // ... existing states ...
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    visibility: 'public' | 'private' | 'password' | 'token';
    logo: string;
    favicon: string;
    cover: string;
    accessToken: string;
    editorType: 'markdown' | 'richtext';
  }>({
    name: currentProject?.name || '',
    description: currentProject?.description || '',
    visibility: (currentProject?.visibility as 'public' | 'private' | 'password' | 'token') || 'public',
    logo: currentProject?.logo || '',
    favicon: currentProject?.favicon || '',
    cover: currentProject?.cover || '',
    accessToken: (currentProject as { accessToken?: string })?.accessToken || '',
    editorType: ((currentProject as { editorType?: string })?.editorType as 'markdown' | 'richtext') || 'markdown',
  });

  // 复制URL到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  // 复制Token链接到剪贴板
  const copyTokenUrl = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setTokenCopied(true);
      toast.success('Token链接已复制到剪贴板');
      setTimeout(() => setTokenCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  // 生成新的访问Token
  const handleGenerateToken = () => {
    const newToken = generateAccessToken();
    setFormData({ ...formData, accessToken: newToken });
    toast.success('已生成新Token，请记得保存设置');
  };

  // 当 currentProject 变化时更新 formData
  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name,
        description: currentProject.description || '',
        visibility: (currentProject.visibility as 'public' | 'private' | 'password' | 'token'),
        logo: currentProject.logo || '',
        favicon: currentProject.favicon || '',
        cover: currentProject.cover || '',
        accessToken: (currentProject as { accessToken?: string }).accessToken || '',
        editorType: ((currentProject as { editorType?: string }).editorType as 'markdown' | 'richtext') || 'markdown',
      });
    }
  }, [currentProject]);

  // 组件挂载时获取项目信息
  useEffect(() => {
    if (identify && (!currentProject || currentProject.identify !== identify)) {
      fetchProject(identify);
    }
  }, [identify, fetchProject, currentProject]);

  // 更新项目基本信息
  const handleUpdateBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      const { name, description, visibility, logo, favicon, cover, accessToken, editorType } = formData;
      const res = await fetch(`/api/projects/${identify}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, visibility, logo, favicon, cover, accessToken, editorType }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('项目信息已更新');
        updateProject(currentProject!.id, { name, description, visibility: visibility as 'public' | 'private' | 'password', logo, favicon, cover });
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setIsUpdating(false);
    }
  };

  // 删除项目
  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/projects/${identify}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('项目已删除');
        router.push('/');
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5 text-primary" />
            基本信息
          </CardTitle>
          <CardDescription className="text-muted-foreground">修改项目的名称、描述和可见性设置</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateBasic} className="space-y-4">
            {/* 项目访问路径 */}
            <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border">
              <Label className="text-foreground/80 flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                项目访问路径
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/docs/${identify}`}
                  readOnly
                  className="bg-background border-border text-foreground font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/docs/${identify}`)}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">此链接可用于分享您的项目文档</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground/80">项目名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-muted/50 border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground/80">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-muted/50 border-border text-foreground min-h-[100px]"
              />
            </div>
            
            {/* Logo、Favicon 和 Cover 上传 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <ImageUploader
                label="项目 Logo"
                value={formData.logo}
                onChange={(url) => setFormData({ ...formData, logo: url })}
                identify={identify}
                type="logo"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
              />
              <ImageUploader
                label="项目 Favicon"
                value={formData.favicon}
                onChange={(url) => setFormData({ ...formData, favicon: url })}
                identify={identify}
                type="favicon"
                accept="image/x-icon,image/png,image/svg+xml"
              />
              <ImageUploader
                label="项目封面"
                value={formData.cover}
                onChange={(url) => setFormData({ ...formData, cover: url })}
                identify={identify}
                type="cover"
                accept="image/png,image/jpeg,image/webp"
              />
            </div>

            {/* 可见性和编辑器类型选择 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground/80">可见性</Label>
                <Select 
                  value={formData.visibility} 
                  onValueChange={(v: 'public' | 'private' | 'password' | 'token') => setFormData({ ...formData, visibility: v })}
                >
                  <SelectTrigger className="bg-muted/50 border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="public">公开 (所有人可见)</SelectItem>
                    <SelectItem value="private">私有 (仅成员可见)</SelectItem>
                    <SelectItem value="password">加密 (凭密码访问)</SelectItem>
                    <SelectItem value="token">Token访问 (凭Token访问)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/80">编辑器类型</Label>
                <Select 
                  value={formData.editorType} 
                  onValueChange={(v: 'markdown' | 'richtext') => setFormData({ ...formData, editorType: v })}
                >
                  <SelectTrigger className="bg-muted/50 border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="markdown">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Markdown 编辑器
                      </div>
                    </SelectItem>
                    <SelectItem value="richtext">
                      <div className="flex items-center gap-2">
                        <FileEdit className="h-4 w-4" />
                        富文本编辑器
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Token访问配置 */}
            {formData.visibility === 'token' && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground/80">带Token的访问链接</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateToken}
                    className="gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    重新生成
                  </Button>
                </div>
                {formData.accessToken ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Input
                        value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/docs/${identify}?token=${formData.accessToken}`}
                        readOnly
                        className="bg-background border-border text-foreground font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyTokenUrl(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/docs/${identify}?token=${formData.accessToken}`)}
                        className="shrink-0"
                      >
                        {tokenCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      拥有此链接的任何人都可以访问该项目。请妥善保管Token。
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    点击&ldquo;重新生成&rdquo;按钮创建访问Token
                  </p>
                )}
              </div>
            )}
            <Button type="submit" disabled={isUpdating} className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2">
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存设置
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            危险区域
          </CardTitle>
          <CardDescription className="text-destructive/80">此操作无法撤销。删除项目后，所有文档和历史记录将被永久移除。</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                删除此项目
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  确认删除项目
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  此操作<span className="font-semibold text-destructive">无法撤销</span>。删除项目后，所有文档和历史记录将被<span className="font-semibold">永久移除</span>。
                  <br /><br />
                  项目名称: <span className="font-mono font-semibold text-foreground">{currentProject?.name}</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border">取消</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteProject}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
