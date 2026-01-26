'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2, Shield, UserPlus, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface ConfigData {
  requireCaptcha: boolean;
  allowRegister: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
}

export function ConfigureManagement() {
  const t = useTranslations('Admin.configure');
  const tc = useTranslations('Common');

  const [config, setConfig] = useState<ConfigData>({
    requireCaptcha: false,
    allowRegister: true,
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/configure');
      const data = await res.json();
      
      if (data.success) {
        setConfig({
          requireCaptcha: data.config.requireCaptcha,
          allowRegister: data.config.allowRegister,
          smtpHost: data.config.smtpHost || '',
          smtpPort: data.config.smtpPort || '',
          smtpUser: data.config.smtpUser || '',
          smtpPassword: data.config.smtpPassword || '', // Will be '******' if set
          smtpFrom: data.config.smtpFrom || '',
        });
      } else {
        toast.error(data.error || tc('error'));
      }
    } catch {
      toast.error(tc('error'));
    } finally {
      setLoading(false);
    }
  }, [tc]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message || t('saveSuccess'));
      } else {
        toast.error(data.error || tc('error'));
      }
    } catch {
      toast.error(tc('error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <div className="grid gap-6">
        {/* 安全设置 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('security')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('securityDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base text-foreground">{t('captcha')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('captchaDesc')}
                </p>
              </div>
              <Switch
                checked={config.requireCaptcha}
                onCheckedChange={(checked) => setConfig({ ...config, requireCaptcha: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* 注册设置 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t('register')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('registerDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base text-foreground">{t('allowRegister')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('allowRegisterDesc')}
                </p>
              </div>
              <Switch
                checked={config.allowRegister}
                onCheckedChange={(checked) => setConfig({ ...config, allowRegister: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* 邮件服务设置 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('smtp')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('smtpDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">{t('smtpHost')}</Label>
                <Input
                  id="smtpHost"
                  placeholder="例如: smtp.gmail.com"
                  value={config.smtpHost}
                  onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">{t('smtpPort')}</Label>
                <Input
                  id="smtpPort"
                  placeholder="例如: 587"
                  value={config.smtpPort}
                  onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUser">{t('smtpUser')}</Label>
                <Input
                  id="smtpUser"
                  placeholder="您的邮箱账号"
                  value={config.smtpUser}
                  onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">{t('smtpPassword')}</Label>
                <PasswordInput
                  id="smtpPassword"
                  placeholder="邮箱密码"
                  value={config.smtpPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig({ ...config, smtpPassword: e.target.value })}
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">{t('smtpPasswordHelp')}</p>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="smtpFrom">{t('smtpFrom')}</Label>
                <Input
                  id="smtpFrom"
                  placeholder="例如: NextDoc <noreply@example.com>"
                  value={config.smtpFrom}
                  onChange={(e) => setConfig({ ...config, smtpFrom: e.target.value })}
                  className="bg-muted/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {tc('loading')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {tc('save')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
