'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  token: string;
  projectName: string;
  role: string;
}

export function InviteAcceptClient({ token, projectName, role }: Props) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [identify, setIdentify] = useState('');

  const roleLabels = { owner: '所有者', editor: '编辑者', viewer: '查看者' };

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      const res = await fetch(`/api/invite/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setIdentify(data.identify);
        toast.success('已成功加入项目');
        // 跳转到项目页
        setTimeout(() => {
          router.push(`/docs/${data.identify}`);
        }, 2000);
      } else {
        toast.error(data.error || '接受邀请失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-linear-to-br from-background via-muted/20 to-background">
      <Card className="max-w-md w-full border-border bg-card/80 backdrop-blur-xl shadow-2xl">
        {!isSuccess ? (
          <>
            <CardHeader className="text-center space-y-4 pt-8">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary shadow-inner">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl font-extrabold tracking-tight">项目协作邀请</CardTitle>
                <CardDescription className="text-lg">您受邀参与 <strong>{projectName}</strong></CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <p className="text-muted-foreground">
                加入后您将以 <span className="text-foreground font-semibold px-2 py-1 bg-muted rounded-md">{roleLabels[role as keyof typeof roleLabels]}</span> 的身份进行协作。
              </p>
            </CardContent>
            <CardFooter className="pb-8">
              <Button 
                onClick={handleAccept} 
                disabled={isAccepting}
                className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {isAccepting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : '接受并加入'}
              </Button>
            </CardFooter>
          </>
        ) : (
          <div className="p-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">欢迎加入！</h2>
              <p className="text-muted-foreground">正在为您跳转到项目页面...</p>
            </div>
            <Button variant="ghost" className="gap-2" onClick={() => router.push(`/docs/${identify}`)}>
              点击手动跳转 <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
