'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Camera, Lock, Mail, BadgeCheck, ChevronLeft, Settings, Info } from 'lucide-react';
import { useUserStore } from '@/stores/user-store';
import { authClient } from '@/lib/auth/auth-client';
import { Header } from '@/components/layout/header';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const t = useTranslations('Profile');
  const { user, updateProfile } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 基本信息 Schema
  const profileSchema = z.object({
    name: z.string().min(2, t('errors.nameTooShort')),
    account: z.string().min(3, t('errors.usernameTooShort')).regex(/^[a-zA-Z0-9_-]+$/, t('errors.usernameInvalid')),
    email: z.string().email(t('errors.emailInvalid')),
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;

  // 密码 Schema
  const passwordSchema = z.object({
    oldPassword: z.string().min(1, t('errors.oldPasswordRequired')),
    newPassword: z.string().min(6, t('errors.newPasswordTooShort')),
    confirmPassword: z.string().min(6, t('errors.newPasswordTooShort')),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('errors.passwordsDoNotMatch'),
    path: ["confirmPassword"],
  });

  type PasswordFormValues = z.infer<typeof passwordSchema>;

  // Profile Form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      account: '',
      email: '',
    },
  });

  // Password Form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        account: user.account || '',
        email: user.email || '',
      });
    }
  }, [user, profileForm]);

  // 处理头像上传
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('errors.fileTooLarge'));
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('identify', 'user-' + (user?.id || 'unknown'));
    formData.append('type', 'avatar');

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.error || t('errors.uploadFailed'));

      const avatarUrl = uploadData.url;

      const updateRes = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileForm.getValues(),
          avatar: avatarUrl,
        }),
      });
      
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error || t('errors.updateFailed'));

      updateProfile({ avatar: avatarUrl });
      toast.success(t('basicInfo.avatarSuccess'));
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : t('errors.updateFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          avatar: user?.avatar,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('errors.updateFailed'));
      }

      updateProfile(result.user);
      toast.success(t('basicInfo.updateSuccess'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: data.oldPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        throw new Error(error.message || t('errors.updateFailed'));
      }

      toast.success(t('security.updateSuccess'));
      passwordForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Link 
          href="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors mb-6 w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              {t('title')}
            </h1>
          </div>

          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="bg-muted border border-border p-1">
              <TabsTrigger value="profile" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 px-6">
                <Info className="h-4 w-4" />
                {t('tabs.basic')}
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 px-6">
                <Lock className="h-4 w-4" />
                {t('tabs.security')}
              </TabsTrigger>
            </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInfo.title')}</CardTitle>
              <CardDescription>
                {t('basicInfo.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-border cursor-pointer">
                    <AvatarImage src={user.avatar || undefined} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-muted">
                        {user.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div 
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-8 h-8" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-lg">{t('basicInfo.avatar')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('basicInfo.avatarHelp')}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={uploading} 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('basicInfo.uploading')}
                      </>
                    ) : (
                      t('basicInfo.changeAvatar')
                    )}
                  </Button>
                </div>
              </div>

              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('basicInfo.name')}</Label>
                    <Input
                      id="name"
                      placeholder={t('basicInfo.namePlaceholder')}
                      {...profileForm.register('name')}
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="account">{t('basicInfo.username')}</Label>
                    <div className="relative">
                        <Input
                        id="account"
                        placeholder={t('basicInfo.usernamePlaceholder')}
                        {...profileForm.register('account')}
                        className="pl-9"
                        />
                        <BadgeCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    {profileForm.formState.errors.account && (
                      <p className="text-sm text-destructive">{profileForm.formState.errors.account.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('basicInfo.email')}</Label>
                  <div className="relative">
                    <Input
                        id="email"
                        type="email"
                        placeholder="example@domain.com"
                        {...profileForm.register('email')}
                        className="pl-9"
                    />
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('basicInfo.saveChanges')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t('security.title')}</CardTitle>
              <CardDescription>
                {t('security.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">{t('security.oldPassword')}</Label>
                  <PasswordInput
                    id="oldPassword"
                    {...passwordForm.register('oldPassword')}
                  />
                  {passwordForm.formState.errors.oldPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.oldPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('security.newPassword')}</Label>
                  <PasswordInput
                    id="newPassword"
                    {...passwordForm.register('newPassword')}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('security.confirmNewPassword')}</Label>
                  <PasswordInput
                    id="confirmPassword"
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('security.updatePassword')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
}
