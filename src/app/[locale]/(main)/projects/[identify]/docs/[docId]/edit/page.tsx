'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/layout/header';
import { useUserStore } from '@/stores/user-store';
import { useDocumentStore } from '@/stores/document-store';
import { Save, Loader2, History, Clock, Bold, Italic, Underline, Heading1, List as ListIcon, Link as LinkIcon, Image as ImageIcon, Quote, Video, Paperclip, AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react';
import { DocumentHistoryList } from '@/components/project/document-history-list';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function DocumentEditPage({ 
  params 
}: { 
  params: Promise<{ identify: string; docId: string }> 
}) {
  const { identify, docId } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const { currentDocument, setCurrentDocument, setSaving, isSaving } = useDocumentStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [project, setProject] = useState<{ editorType?: string } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'attachment'>('image');
  
  // 选中的媒体元素管理
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [toolbarStyle, setToolbarStyle] = useState<React.CSSProperties>({ display: 'none' });

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  };

  const handleLink = () => {
    const url = window.prompt('请输入链接地址:');
    if (url) execCommand('createLink', url);
  };

  const triggerUpload = (type: 'image' | 'video' | 'attachment') => {
    setUploadType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('identify', identify);
    formData.append('type', uploadType);

    setSaving(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        if (project?.editorType === 'richtext') {
          // 富文本模式
          if (uploadType === 'image') {
            // 先尝试把光标移回编辑器
            editorRef.current?.focus();
            execCommand('insertImage', data.url);
          } else if (uploadType === 'video') {
            editorRef.current?.focus();
            const videoHtml = `<video src="${data.url}" controls style="max-width: 100%; border-radius: 8px; margin: 10px 0; display: block;"></video><p></p>`;
            document.execCommand('insertHTML', false, videoHtml);
          } else {
            editorRef.current?.focus();
            const fileHtml = `<a href="${data.url}" target="_blank" class="attachment-link" style="display: inline-flex; items-center; gap: 4px; padding: 4px 8px; background: rgba(0,0,0,0.05); border-radius: 4px; text-decoration: none; color: inherit;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>${data.fileName || '附件'}</a>&nbsp;`;
            document.execCommand('insertHTML', false, fileHtml);
          }
          if (editorRef.current) setContent(editorRef.current.innerHTML);
        } else {
          // Markdown 模式
          let markdownText = '';
          if (uploadType === 'image') {
            markdownText = `![${data.fileName}](${data.url})\n`;
          } else if (uploadType === 'video') {
            markdownText = `\n<video src="${data.url}" controls style="max-width: 100%;"></video>\n`;
          } else {
            markdownText = `[附件：${data.fileName}](${data.url})\n`;
          }
          
          setContent(prev => prev + markdownText);
        }
      } else {
        setError(data.error || '上传失败');
      }
    } catch {
      setError('上传请求失败');
    } finally {
      setSaving(false);
      if (e.target) e.target.value = ''; // 重置 input
    }
  };

  // 处理图片和视频的点击选中
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
        // 先移除之前选中的样式
        if (selectedElement) {
          selectedElement.style.outline = 'none';
          selectedElement.style.boxShadow = 'none';
        }

        setSelectedElement(target);
        
        // 添加选中视觉效果
        target.style.outline = '2px solid #3b82f6';
        target.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.5)';
        target.style.cursor = 'default';
        
        // 计算工具栏位置 (相对于编辑器容器)
        const editorContainer = editor.parentElement; // 拿到 relative 容器
        if (editorContainer) {
          const rect = target.getBoundingClientRect();
          const containerRect = editorContainer.getBoundingClientRect();
          
          setToolbarStyle({
            display: 'flex',
            top: `${rect.top - containerRect.top - 45}px`, 
            left: `${rect.left - containerRect.left + (rect.width / 2) - 100}px`,
          });
        }
      } else if (!(target.closest('.media-toolbar'))) {
        if (selectedElement) {
          selectedElement.style.outline = 'none';
          selectedElement.style.boxShadow = 'none';
        }
        setSelectedElement(null);
        setToolbarStyle({ display: 'none' });
      }
    };

    editor.addEventListener('click', handleClick);
    return () => editor.removeEventListener('click', handleClick);
  }, [selectedElement]);

  // 修改选中元素的大小
  const setElementSize = (size: string) => {
    if (!selectedElement) return;
    selectedElement.style.width = size;
    selectedElement.style.height = 'auto'; // 保持比例
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  };

  // 修改选中元素的位置
  const setElementAlign = (align: 'left' | 'center' | 'right') => {
    if (!selectedElement) return;
    
    if (align === 'center') {
      selectedElement.style.display = 'block';
      selectedElement.style.margin = '10px auto';
      selectedElement.style.float = 'none';
      selectedElement.style.clear = 'both';
    } else if (align === 'left') {
      selectedElement.style.display = 'inline-block';
      selectedElement.style.float = 'left';
      selectedElement.style.margin = '0 20px 20px 0';
      selectedElement.style.clear = 'none';
    } else if (align === 'right') {
      selectedElement.style.display = 'inline-block';
      selectedElement.style.float = 'right';
      selectedElement.style.margin = '0 0 20px 20px';
      selectedElement.style.clear = 'none';
    }
    
    if (editorRef.current) setContent(editorRef.current.innerHTML);
    
    // 重新校准工具栏位置
    // 重新校准工具栏位置
    setTimeout(() => {
      if (selectedElement && editorRef.current) {
        const editorContainer = editorRef.current.parentElement;
        if (editorContainer) {
          const rect = selectedElement.getBoundingClientRect();
          const containerRect = editorContainer.getBoundingClientRect();
          setToolbarStyle(prev => ({
            ...prev,
            top: `${rect.top - containerRect.top - 45}px`,
            left: `${rect.left - containerRect.left + (rect.width / 2) - 100}px`,
          }));
        }
      }
    }, 50);
  };

  // 删除选中元素
  const deleteElement = () => {
    if (!selectedElement) return;
    selectedElement.remove();
    setSelectedElement(null);
    setToolbarStyle({ display: 'none' });
    if (editorRef.current) setContent(editorRef.current.innerHTML);
  };

  // 合并后的生命周期逻辑
  // 1. 初始化富文本编辑器内容
  useEffect(() => {
    if (project?.editorType === 'richtext' && editorRef.current && content && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [project?.editorType, content]);

  // 2. 获取文档详情
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${docId}`);
        const data = await response.json();
        if (response.ok) {
          setCurrentDocument(data.document);
          setTitle(data.document.title);
          setContent(data.document.content || '');
          setProject(data.project);
        } else {
          setError(data.error || '获取文档失败');
        }
      } catch {
        setError('网络错误');
      }
    };
    fetchDocument();
  }, [docId, setCurrentDocument]);

  // 3. 保存文档逻辑
  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || '保存失败');
        return;
      }
      setCurrentDocument(data.document);
      setLastSaved(new Date());
    } catch {
      setError('网络错误');
    } finally {
      setSaving(false);
    }
  }, [docId, title, content, setSaving, setCurrentDocument]);

  // 4. 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // 5. 权限检查
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (error && !currentDocument) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{error}</h2>
          <Button variant="outline" onClick={() => router.back()}>返回</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 编辑器头部 */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${identify}`)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回项目
            </Button>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">
              {isSaving ? '保存中...' : lastSaved ? `上次保存：${lastSaved.toLocaleTimeString('zh-CN')}` : '未保存'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-accent"
              onClick={() => router.push(`/projects/${identify}`)}
            >
              取消
            </Button>
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-muted/50 border-border text-foreground hover:bg-accent gap-2">
                    <History className="h-4 w-4" />
                    历史
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-background border-l border-border text-foreground w-[400px]">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-foreground flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      版本历史
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                      查看文档的历史修改记录，您可以恢复到之前的任何版本。
                    </SheetDescription>
                  </SheetHeader>
                  <DocumentHistoryList 
                    docId={docId} 
                    onRestore={() => {
                      // 恢复成功后刷新当前内容
                      const fetchAgain = async () => {
                        const res = await fetch(`/api/documents/${docId}`);
                        const data = await res.json();
                        if (data.success) {
                          setTitle(data.document.title);
                          setContent(data.document.content || '');
                        }
                      };
                      fetchAgain();
                    }} 
                  />
                </SheetContent>
              </Sheet>

              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground border-none gap-2"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存 (Ctrl+S)
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* 标题输入 */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文档标题"
            className="mb-4 text-2xl font-bold bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:ring-0 px-0"
          />

          {/* 内容编辑器 */}
          {project?.editorType === 'richtext' ? (
            <div className="h-[calc(100vh-200px)] bg-muted/30 border border-border rounded-lg overflow-hidden flex flex-col relative">
              {/* 富文本编辑器的功能工具栏 */}
              <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/80 backdrop-blur-md sticky top-0 z-10">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => execCommand('bold')}
                  className="h-8 w-8 p-0 text-foreground hover:bg-background"
                  title="加粗"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => execCommand('italic')}
                  className="h-8 w-8 p-0 text-foreground hover:bg-background"
                  title="斜体"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => execCommand('underline')}
                  className="h-8 w-8 p-0 text-foreground hover:bg-background"
                  title="下划线"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                
                <div className="h-4 w-px bg-border mx-1" />
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => execCommand('formatBlock', '<h2>')}
                  className="h-8 w-8 p-0 text-foreground hover:bg-background"
                  title="标题"
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => execCommand('insertUnorderedList')}
                  className="h-8 w-8 p-0 text-foreground hover:bg-background"
                  title="列表"
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => execCommand('formatBlock', '<blockquote>')}
                  className="h-8 w-8 p-0 text-foreground hover:bg-background"
                  title="引用"
                >
                  <Quote className="h-4 w-4" />
                </Button>
                
                <div className="h-4 w-px bg-border mx-1" />
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLink}
                  className="h-8 w-8 p-0 text-foreground hover:bg-background"
                  title="链接"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => triggerUpload('image')}
                  className="h-8 w-8 p-0 text-foreground hover:bg-background"
                  title="上传图片"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => triggerUpload('video')}
                  className="h-8 w-8 p-0 text-foreground hover:bg-background"
                  title="上传视频"
                >
                  <Video className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => triggerUpload('attachment')}
                  className="h-8 w-8 p-0 text-foreground hover:bg-background"
                  title="上传附件"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              
              <div
                ref={editorRef}
                contentEditable
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                className="flex-1 bg-transparent border-none outline-none overflow-y-auto px-6 py-6 prose dark:prose-invert max-w-none rich-text-content [&>*:first-child]:mt-0"
                style={{ outline: 'none' }}
              />
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="开始编写 Markdown 内容..."
              className="h-[calc(100vh-200px)] bg-muted/30 border-border text-foreground placeholder:text-muted-foreground resize-none font-mono text-sm leading-relaxed focus-visible:ring-primary/20"
            />
          )}

          {/* 编辑提示 */}
          <div className="mt-4 text-xs text-muted-foreground/60 flex items-center gap-2">
            <div className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${project?.editorType === 'richtext' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
              {project?.editorType === 'richtext' ? '富文本模式' : 'Markdown 模式'}
            </div>
            <span>•</span>
            <span>按 ⌘+S 或 Ctrl+S 快速保存</span>
          </div>
          
          {/* 媒体元素控制菜单 */}
          {selectedElement && (
            <div 
              className="media-toolbar absolute z-50 flex items-center gap-1 p-1 bg-popover border border-border rounded-lg shadow-xl animate-in fade-in zoom-in duration-200"
              style={toolbarStyle}
            >
              <div className="flex items-center border-r border-border pr-1 mr-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setElementAlign('left')} title="左对齐"><AlignLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setElementAlign('center')} title="居中对齐"><AlignCenter className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setElementAlign('right')} title="右对齐"><AlignRight className="h-4 w-4" /></Button>
              </div>
              <div className="flex items-center border-r border-border pr-1 mr-1 gap-1">
                <Button variant="ghost" className="h-7 px-1.5 text-[10px]" onClick={() => setElementSize('25%')}>25%</Button>
                <Button variant="ghost" className="h-7 px-1.5 text-[10px]" onClick={() => setElementSize('50%')}>50%</Button>
                <Button variant="ghost" className="h-7 px-1.5 text-[10px]" onClick={() => setElementSize('100%')}>100%</Button>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={deleteElement} title="删除"><Trash2 className="h-4 w-4" /></Button>
            </div>
          )}
          {/* 隐藏的文件上传输入框 */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept={
              uploadType === 'image' 
                ? 'image/*' 
                : uploadType === 'video' 
                  ? 'video/*' 
                  : '*'
            }
          />
        </div>
      </main>
    </div>
  );
}
