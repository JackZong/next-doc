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
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {histories.map((item) => (
          <div 
            key={item.id} 
            className="flex items-start justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/50 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-500 px-1.5 py-0.5 bg-blue-500/10 rounded">
                  v{item.version}
                </span>
                <span className="text-sm font-medium text-zinc-200">
                  {item.changeLog || '更新文档内容'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.creatorName}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: zhCN })}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={!!isRestoring}
              onClick={() => handleRestore(item.id)}
              className="text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 h-8 gap-1"
            >
              {isRestoring === item.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              恢复
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
