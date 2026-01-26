'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/layout/header';
import { useUserStore } from '@/stores/user-store';
import { useDocumentStore } from '@/stores/document-store';
import { Save, Loader2, History, Clock, Bold, Italic, Underline, Heading1, List as ListIcon, Link as LinkIcon, Image as ImageIcon, Quote } from 'lucide-react';
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

  const handleImage = () => {
    const url = window.prompt('请输入图片地址:');
    if (url) execCommand('insertImage', url);
  };

  // 初始化富文本编辑器内容
  useEffect(() => {
    if (project?.editorType === 'richtext' && editorRef.current && content && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [project?.editorType, content]);

  // 获取文档
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

  // 保存文档
  const handleSave = useCallback(async () => {
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

  // 键盘快捷键保存
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

  // 未登录重定向
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
          <Button variant="outline" onClick={() => router.back()}>
            返回
          </Button>
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
            <div className="min-h-[calc(100vh-250px)] bg-muted/30 border border-border rounded-lg overflow-hidden flex flex-col">
              {/* 富文本编辑器的功能工具栏 */}
              <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/50">
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
                  onClick={handleImage}
                  className="h-8 w-8 p-0 text-foreground hover:bg-background"
                  title="图片"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div
                ref={editorRef}
                contentEditable
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                className="flex-1 min-h-[calc(100vh-320px)] bg-transparent border-none outline-none overflow-y-auto px-6 py-6 prose dark:prose-invert max-w-none rich-text-content [&>*:first-child]:mt-0"
                style={{ outline: 'none' }}
              />
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="开始编写 Markdown 内容..."
              className="min-h-[calc(100vh-200px)] bg-muted/30 border-border text-foreground placeholder:text-muted-foreground resize-none font-mono text-sm leading-relaxed focus-visible:ring-primary/20"
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
        </div>
      </main>
    </div>
  );
}
