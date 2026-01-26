'use client';

import { useState, Suspense } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { authClient } from '@/lib/auth/auth-client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

function ResetPasswordForm() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // 如果没有 token，显示错误
  if (!token) {
    return (
      <Card className="w-full max-w-md bg-card border-border backdrop-blur-xl shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">{t('invalidLinkTitle')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('invalidLinkDescription')}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-4">
          <Link href="/forgot-password" title={t('getNewLink')} className="w-full">
            <Button className="w-full" variant="outline">
              {t('getNewLink')}
            </Button>
          </Link>
          <Link href="/login" className="text-sm text-primary hover:underline">
            {t('backToLogin')}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        toast.error(error.message || t('resetFailed'));
        return;
      }

      setResetSuccess(true);
      toast.success(t('resetSuccessTitle'));
    } catch {
      toast.error(t('networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <Card className="w-full max-w-md bg-card border-border backdrop-blur-xl shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">{t('resetSuccessTitle')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('resetSuccessDescription')}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button 
            className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => router.push('/login')}
          >
            {t('goToLogin')}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-card border-border backdrop-blur-xl shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <Logo size="xl" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">{t('setNewPasswordTitle')}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {t('setNewPasswordDescription')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground/80">{t('newPassword')}</Label>
            <PasswordInput
              id="password"
              placeholder={t('passwordMinLength')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground/80">{t('confirmNewPassword')}</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder={t('confirmNewPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? t('resetting') : t('resetPassword')}
          </Button>
          <Link 
            href="/login" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('backToLogin')}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
