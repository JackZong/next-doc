'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/layout/header';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { useUserStore } from '@/stores/user-store';
import { useProjectStore } from '@/stores/project-store';
import { useDocumentStore, DocumentTreeNode } from '@/stores/document-store';
import { Edit, Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// 文档树节点组件
function DocumentTreeItem({ 
  node, 
  projectIdentify,
  level = 0,
  selectedId,
  onSelect,
  onDelete,
  onRename,
  onCreateChild,
  canEdit
}: { 
  node: DocumentTreeNode & { children?: DocumentTreeNode[] };
  projectIdentify: string;
  level?: number;
  selectedId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onRename: (id: string, title: string) => void;
  onCreateChild: (parentId: string) => void;
  canEdit?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (

    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors w-full max-w-full overflow-hidden shrink-0 ${
              selectedId === node.id 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
            }`}
            style={{ paddingLeft: `${8 + level * 16}px` }}
            onClick={() => onSelect(node.id)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className={`p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded shrink-0 transition-colors ${!hasChildren ? 'invisible' : ''}`}
            >
              <svg 
                className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            
            <span className="flex-1 truncate text-sm leading-none select-none py-1">{node.title}</span>
          </div>
        </ContextMenuTrigger>
        
        {canEdit && (
          <ContextMenuContent>
             <ContextMenuItem 
              onClick={() => {
                onCreateChild(node.id);
                setExpanded(true);
              }}
            >
              新建子文档
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onRename(node.id, node.title)}>
              重命名
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onDelete(node.id, node.title)}
              className="text-destructive focus:text-destructive"
            >
              删除
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>

      {hasChildren && expanded && (
        <div className="mt-0.5">
          {node.children!.map((child) => (
            <DocumentTreeItem
              key={child.id}
              node={child as DocumentTreeNode & { children?: DocumentTreeNode[] }}
              projectIdentify={projectIdentify}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
              onCreateChild={onCreateChild}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );

}

export default function ProjectDetailPage({ params }: { params: Promise<{ identify: string }> }) {
  const { identify } = use(params);
  const router = useRouter();
  
  // 使用选择器以避免不必要的重渲染
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  
  const currentProject = useProjectStore((state) => state.currentProject);
  const fetchProject = useProjectStore((state) => state.fetchProject);
  
  const documents = useDocumentStore((state) => state.documents);
  const setDocuments = useDocumentStore((state) => state.setDocuments);
  const currentDocument = useDocumentStore((state) => state.currentDocument);
  const setCurrentDocument = useDocumentStore((state) => state.setCurrentDocument);
  const isDocLoading = useDocumentStore((state) => state.isLoading);
  const setDocLoading = useDocumentStore((state) => state.setLoading);
  
  const [error, setError] = useState('');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [deleteDocConfirm, setDeleteDocConfirm] = useState<{ id: string; title: string } | null>(null);
  const [renameDoc, setRenameDoc] = useState<{ id: string; title: string } | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const lastIdentifyRef = useRef<string | null>(null);

  // 获取项目详情
  useEffect(() => {
    // 只有在标识符存在，且与上次请求的标识符不一致（忽略大小写），
    // 且与当前 Store 中已有的项目标识符也不一致时，才发起请求。
    const isDifferent = !lastIdentifyRef.current || 
                        lastIdentifyRef.current.toLowerCase() !== identify.toLowerCase();
    
    if (identify && isDifferent && currentProject?.identify !== identify) {
      lastIdentifyRef.current = identify;
      fetchProject(identify).catch((err) => {
        console.error('获取项目失败:', err);
        setError('获取项目具体信息失败');
      });
    }
  }, [identify, fetchProject, currentProject?.identify]);

  // 获取文档列表
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!currentProject?.id) return;

      setDocLoading(true);

      try {
        const response = await fetch(`/api/documents?identify=${identify}`);
        const data = await response.json();

        if (response.ok) {
          setDocuments(data.documents);
          
          if (data.documents && data.documents.length > 0) {
            // 如果当前没有文档，或者当前文档不属于该项目，则选中第一个
            if (!currentDocument || currentDocument.projectId !== currentProject.id) {
               handleSelectDocument(data.documents[0].id);
            }
          } else {
            setCurrentDocument(null);
          }
        }
      } catch {
        console.error('获取文档失败');
      } finally {
        setDocLoading(false);
      }
    };

    fetchDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, identify, setDocuments, setDocLoading]);

  // 获取文档详情
  const handleSelectDocument = async (docId: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}`);
      const data = await response.json();

      if (response.ok) {
        setCurrentDocument(data.document);
      }
    } catch {
      console.error('获取文档详情失败');
    }
  };

  // 创建新文档
  const handleCreateDocument = async (parentId?: string) => {
    if (!currentProject) return;

    setIsCreatingDoc(true);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          parentId,
          title: '新文档',
          content: '# 新文档\n\n开始编写内容...',
          contentType: 'markdown',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 刷新文档列表
        const docsResponse = await fetch(`/api/documents?identify=${identify}`);
        const docsData = await docsResponse.json();
        if (docsResponse.ok) {
          setDocuments(docsData.documents);
        }
        // 选中新文档
        handleSelectDocument(data.document.id);
      }
    } catch {
      console.error('创建文档失败');
    } finally {
      setIsCreatingDoc(false);
      setDeleteDocConfirm(null);
    }
  };

  // 删除文档
  const handleDeleteDocument = async () => {
    if (!deleteDocConfirm) return;
    
    const { id: docId } = deleteDocConfirm;

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('文档已删除');
        // 如果删除的是当前文档，清空当前选中项
        if (currentDocument?.id === docId) {
          setCurrentDocument(null);
        }
        // 刷新文档列表
        const docsResponse = await fetch(`/api/documents?identify=${identify}`);
        const docsData = await docsResponse.json();
        if (docsResponse.ok) {
          setDocuments(docsData.documents);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || '删除失败');
      }
    } finally {
      setDeleteDocConfirm(null);
    }
  };

  // 重命名文档
  const handleRenameDocument = async () => {
    if (!renameDoc || !renameTitle.trim()) return;
    
    const { id: docId } = renameDoc;

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameTitle }),
      });

      if (response.ok) {
        toast.success('文档已重命名');
        // 如果重命名的是当前文档，更新当前文档信息
        if (currentDocument?.id === docId) {
          setCurrentDocument({ ...currentDocument, title: renameTitle });
        }
        // 刷新文档列表
        const docsResponse = await fetch(`/api/documents?identify=${identify}`);
        const docsData = await docsResponse.json();
        if (docsResponse.ok) {
          setDocuments(docsData.documents);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || '重命名失败');
      }
    } catch (error) {
      console.error('重命名文档错误:', error);
      toast.error('网络错误，重命名失败');
    } finally {
      setRenameDoc(null);
    }
  };

  // 检查编辑权限
  const canEdit = isAuthenticated && (
    currentProject?.ownerId === user?.id ||
    user?.role === 'admin'
  );

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{error}</h2>
          <Button variant="outline" onClick={() => router.push('/')}>
            返回首页
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header projectLogo={currentProject?.logo} projectTitle={currentProject?.name} />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* 侧边栏 - 文档树 */}
        <aside className="w-72 border-r border-border bg-card flex flex-col">


          {/* 文档操作 */}
          {canEdit && (
            <div className="p-4 border-b border-border">
              <Button
                size="sm"
                className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-primary-foreground"
                onClick={() => handleCreateDocument()}
                disabled={isCreatingDoc}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新建文档
              </Button>
            </div>
          )}

          {/* 文档树 */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {isDocLoading ? (
                <div className="space-y-2 p-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full bg-muted" />
                  ))}
                </div>
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <DocumentTreeItem
                    key={doc.id}
                    node={doc as DocumentTreeNode & { children?: DocumentTreeNode[] }}
                    projectIdentify={identify}
                    selectedId={currentDocument?.id}
                    onSelect={handleSelectDocument}
                    onDelete={(id, title) => setDeleteDocConfirm({ id, title })}
                    onRename={(id, title) => {
                      setRenameDoc({ id, title });
                      setRenameTitle(title);
                    }}
                    onCreateChild={(parentId) => handleCreateDocument(parentId)}
                    canEdit={canEdit}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  暂无文档
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-auto bg-background">
          {currentDocument ? (
            <div className="flex flex-col h-full">
               {/* 文档预览头部 */}
              <div className="flex items-center justify-end p-4 border-b border-border bg-card/30 sticky top-0 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="bg-background/50 border-border text-foreground hover:bg-accent gap-1" asChild>
                    <Link href={`/projects/${identify}/docs/${currentDocument.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      编辑
                    </Link>
                  </Button>
                  {(currentProject?.ownerId === user?.id || user?.role === 'admin') && (
                    <Button variant="outline" size="sm" className="bg-background/50 border-border text-foreground hover:bg-accent gap-1" asChild>
                      <Link href={`/projects/${identify}/settings`}>
                        <Settings className="h-4 w-4" />
                        设置
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="mx-auto w-full p-10 lg:p-16">
                {/* 文档标题 - 增强版 */}
                <div className="mb-10">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                    {currentDocument.title}
                  </h1>
                </div>

                {/* 文档元信息 - 更加精致 */}
                <div className="flex flex-wrap items-center gap-y-4 gap-x-6 text-[13px] text-muted-foreground/80 mb-12 pb-6 border-b border-border/40">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/20">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-foreground/90 font-semibold">{currentDocument.authorName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{currentDocument.viewCount} 次阅读</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>最后更新：{currentDocument.updatedAt ? new Date(currentDocument.updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '未知'}</span>
                  </div>
                </div>

                {/* 文档内容 */}
                <div className="prose dark:prose-invert prose-blue max-w-none">
                  {currentProject?.editorType === 'richtext' ? (
                    <div 
                      className="rich-text-content text-foreground/90 leading-8"
                      dangerouslySetInnerHTML={{ __html: currentDocument.content || '' }} 
                    />
                  ) : (
                    <MarkdownRenderer content={currentDocument.content || ''} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* 未选中文档时的顶部工具栏 */}
              {(currentProject?.ownerId === user?.id || user?.role === 'admin') && (
                <div className="flex items-center justify-end p-4 border-b border-border bg-card/30">
                  <Button variant="outline" size="sm" className="bg-background/50 border-border text-foreground hover:bg-accent gap-1" asChild>
                    <Link href={`/projects/${identify}/settings`}>
                      <Settings className="h-4 w-4" />
                      设置
                    </Link>
                  </Button>
                </div>
              )}
              
              {/* 空状态提示 */}
              <div className="flex items-center justify-center flex-1">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">选择一个文档</h3>
                  <p className="text-muted-foreground text-sm">从左侧文档树中选择一个文档查看</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AlertDialog open={!!deleteDocConfirm} onOpenChange={(open) => !open && setDeleteDocConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除文档 &quot;{deleteDocConfirm?.title}&quot; 吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可逆。删除后，该文档的所有子文档及其历史记录也将被同步永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!renameDoc} onOpenChange={(open) => !open && setRenameDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改文档名称</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              placeholder="请输入新的文档名称"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameDocument();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDoc(null)}>取消</Button>
            <Button onClick={handleRenameDocument}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
