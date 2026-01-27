import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, Clock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DocumentHistory {
  id: string;
  version: number;
  changeLog?: string;
  createdAt: string;
  creatorName: string;
}

export function DocumentHistoryList({ 
  docId, 
  onRestore 
}: { 
  docId: string;
  onRestore?: () => void;
}) {
  const [histories, setHistories] = useState<DocumentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistories = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/documents/${docId}/history`);
        const data = await res.json();
        if (data.success) {
          setHistories(data.histories);
        }
      } catch {
        toast.error('获取历史记录失败');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistories();
  }, [docId]);

  const handleRestore = async (historyId: string) => {
    if (!confirm('确定要恢复到此版本吗？当前未保存的修改可能会丢失。')) return;

    try {
      setIsRestoring(historyId);
      const res = await fetch(`/api/documents/${docId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('版本恢复成功');
        if (onRestore) onRestore();
      } else {
        toast.error(data.error || '恢复失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setIsRestoring(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (histories.length === 0) {
    return (
      <div className="text-center p-8 text-zinc-500">
        <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>暂无历史版本记录</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-3 px-1 py-2">
        {histories.map((item, index) => (
          <div key={item.id} className="group transition-all duration-300">
            <div 
              className={`relative flex flex-col gap-2 p-4 rounded-xl border transition-all duration-200 ${
                index === 0 
                  ? 'bg-primary/5 border-primary/30 shadow-[0_2px_12px_-3px_rgba(var(--primary),0.08)]' 
                  : 'bg-card border-border/80 hover:border-primary/30 hover:bg-accent/30'
              }`}
            >
              {/* 顶部：版本 + 标题 */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider ${
                      index === 0 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted-foreground/10 text-muted-foreground'
                    }`}>
                      V{item.version}
                    </span>
                    {index === 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        <div className="h-1 w-1 rounded-full bg-emerald-500" />
                        当前
                      </div>
                    )}
                    <h4 className="text-[13px] font-bold text-foreground leading-tight truncate">
                      {item.changeLog || '文档快照'}
                    </h4>
                  </div>
                  
                  {/* 中部：元数据 */}
                  <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground/70 font-medium">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border/50">
                        <User className="h-2 w-2" />
                      </div>
                      <span>{item.creatorName}</span>
                    </div>
                    <span className="opacity-30">•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 opacity-60" />
                      <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: zhCN })}</span>
                    </div>
                  </div>
                </div>

                {index !== 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!!isRestoring}
                    onClick={() => handleRestore(item.id)}
                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all shrink-0 ml-auto"
                    title="恢复此版本"
                  >
                    {isRestoring === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
              
              {/* 日志详情（如果有） */}
              {item.changeLog && item.changeLog !== '更新文档内容' && (
                <p className="text-[11px] text-muted-foreground/60 bg-muted/20 p-2 rounded border border-border/20 line-clamp-2 italic">
                  &ldquo;{item.changeLog}&rdquo;
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
