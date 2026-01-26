'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { useUserStore } from '@/stores/user-store';

export default function NewProjectPage() {
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const [name, setName] = useState('');
  const [identify, setIdentify] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'password'>('private');
  const [password, setPassword] = useState('');
  const [editorType, setEditorType] = useState<'markdown' | 'richtext'>('markdown');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 自动生成标识
  const handleNameChange = (value: string) => {
    setName(value);
    // 将名称转换为 URL 友好的标识
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
    setIdentify(slug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          identify,
          description,
          visibility,
          password: visibility === 'password' ? password : undefined,
          editorType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '创建项目失败');
        return;
      }

      router.push(`/projects/${data.project.identify}`);
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">新建项目</CardTitle>
              <CardDescription className="text-muted-foreground">
                创建一个新的文档项目来管理您的文档
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* 项目名称 */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground/80">项目名称 *</Label>
                  <Input
                    id="name"
                    placeholder="例如：API 文档"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* 项目标识 */}
                <div className="space-y-2">
                  <Label htmlFor="identify" className="text-foreground/80">项目标识 *</Label>
                  <Input
                    id="identify"
                    placeholder="api-docs"
                    value={identify}
                    onChange={(e) => setIdentify(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    required
                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    用于项目 URL，只能包含小写字母、数字和横杠
                  </p>
                </div>

                {/* 项目描述 */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground/80">项目描述</Label>
                  <Textarea
                    id="description"
                    placeholder="简单描述一下这个项目..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground resize-none"
                  />
                </div>

                {/* 可见性 */}
                <div className="space-y-3">
                  <Label className="text-foreground/80">可见性</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* 私有 */}
                    <button
                      type="button"
                      onClick={() => setVisibility('private')}
                      className={`p-4 rounded-lg border transition-all ${
                        visibility === 'private'
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/50 hover:border-foreground/20'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className={`w-6 h-6 ${visibility === 'private' ? 'text-primary' : 'text-muted-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className={`text-sm ${visibility === 'private' ? 'text-primary' : 'text-muted-foreground'}`}>私有</span>
                      </div>
                    </button>

                    {/* 公开 */}
                    <button
                      type="button"
                      onClick={() => setVisibility('public')}
                      className={`p-4 rounded-lg border transition-all ${
                        visibility === 'public'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-border bg-muted/50 hover:border-foreground/20'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className={`w-6 h-6 ${visibility === 'public' ? 'text-emerald-500' : 'text-muted-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`text-sm ${visibility === 'public' ? 'text-emerald-500' : 'text-muted-foreground'}`}>公开</span>
                      </div>
                    </button>

                    {/* 密码保护 */}
                    <button
                      type="button"
                      onClick={() => setVisibility('password')}
                      className={`p-4 rounded-lg border transition-all ${
                        visibility === 'password'
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-border bg-muted/50 hover:border-foreground/20'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className={`w-6 h-6 ${visibility === 'password' ? 'text-amber-500' : 'text-muted-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span className={`text-sm ${visibility === 'password' ? 'text-amber-500' : 'text-muted-foreground'}`}>密码</span>
                      </div>
                    </button>
                  </div>

                  {/* 密码输入 */}
                  {visibility === 'password' && (
                    <div className="mt-3">
                      <PasswordInput
                        placeholder="设置访问密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  )}
                </div>

                {/* 编辑器类型 */}
                <div className="space-y-3">
                  <Label className="text-foreground/80">编辑器类型</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Markdown */}
                    <button
                      type="button"
                      onClick={() => setEditorType('markdown')}
                      className={`p-4 rounded-lg border transition-all ${
                        editorType === 'markdown'
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/50 hover:border-foreground/20'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className={`w-6 h-6 ${editorType === 'markdown' ? 'text-primary' : 'text-muted-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className={`text-sm font-medium ${editorType === 'markdown' ? 'text-primary' : 'text-muted-foreground'}`}>Markdown</span>
                        <span className="text-xs text-muted-foreground text-center">轻量级标记语言</span>
                      </div>
                    </button>

                    {/* 富文本 */}
                    <button
                      type="button"
                      onClick={() => setEditorType('richtext')}
                      className={`p-4 rounded-lg border transition-all ${
                        editorType === 'richtext'
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/50 hover:border-foreground/20'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className={`w-6 h-6 ${editorType === 'richtext' ? 'text-primary' : 'text-muted-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className={`text-sm font-medium ${editorType === 'richtext' ? 'text-primary' : 'text-muted-foreground'}`}>富文本</span>
                        <span className="text-xs text-muted-foreground text-center">所见即所得编辑器</span>
                      </div>
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-border text-foreground hover:bg-accent"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? '创建中...' : '创建项目'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
