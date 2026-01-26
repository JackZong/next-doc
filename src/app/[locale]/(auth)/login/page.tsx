'use client';

import { useState, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { authClient } from '@/lib/auth/auth-client';
import { useUserStore } from '@/stores/user-store';
import { Github, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

function LoginForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<{ github: boolean, google: boolean }>({ github: false, google: false });
  const { login } = useUserStore();

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch('/api/auth/providers');
        const data = await res.json();
        if (data.success) {
          setProviders({ github: data.github, google: data.google });
        }
      } catch {
        console.error('获取登录方式失败');
      }
    };
    fetchProviders();
  }, []);

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: redirect,
      });
    } catch {
      toast.error(t('socialLoginFailed'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: redirect
      });

      if (error) {
        toast.error(error.message || t('loginFailed'));
        return;
      }

      // 登录成功后，获取用户信息并更新 store
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData.success && meData.user) {
        login(meData.user);
      }

      toast.success(t('loginSuccess'));
      router.push(redirect);
      router.refresh();
    } catch {
      toast.error(t('networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card border-border backdrop-blur-xl shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <Logo size="xl" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">{t('welcomeBack')}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {t('loginToAccount')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground/80">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground/80">{t('password')}</Label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-6">
          <Button 
            type="submit" 
            className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-primary-foreground font-medium shadow-lg shadow-primary/20"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isLoading ? t('loggingIn') : t('login')}
          </Button>
          
          <div className="flex items-center justify-between w-full text-sm">
            <Link 
              href="/forgot-password" 
              className="text-primary hover:underline transition-colors"
            >
              {t('forgotPassword')}
            </Link>
            
            <div className="text-muted-foreground">
              {t('noAccountAction')}{' '}
              <Link 
                href={`/register?redirect=${encodeURIComponent(redirect)}`} 
                className="text-primary hover:underline transition-colors font-medium"
              >
                {t('registerNow')}
              </Link>
            </div>
          </div>

          {(providers.github || providers.google) && (
            <div className="space-y-4 w-full">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">{t('orLoginWith')}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {providers.github && (
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full border-border hover:bg-muted/50 transition-all font-medium"
                    onClick={() => handleSocialLogin('github')}
                  >
                    <Github className="mr-2 h-4 w-4" />
                    {t('loginWithGithub')}
                  </Button>
                )}
                {providers.google && (
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full border-border hover:bg-muted/50 transition-all font-medium"
                    onClick={() => handleSocialLogin('google')}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C9.03,19.27 6.59,17.38 6.59,12.03C6.59,6.68 9.03,4.79 12.19,4.79C14.73,4.79 16.23,6.11 16.23,6.11L18.4,4.24C18.4,4.24 16.07,2.1 12.19,2.1C6.67,2.1 3.5,6.44 3.5,12.03C3.5,17.62 6.67,21.96 12.19,21.96C17.41,21.96 21.49,18.06 21.49,12.03C21.49,11.63 21.35,11.1 21.35,11.1V11.1Z"
                      />
                    </svg>
                    {t('loginWithGoogle')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
