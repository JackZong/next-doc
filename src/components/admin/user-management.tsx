'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Search, Ban, CheckCircle, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

interface User {
  id: string;
  account: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'disabled';
  createdAt: string;
}

export function UserManagement() {
  const t = useTranslations('Admin.users');
  const tc = useTranslations('Common');
  const tr = useTranslations('Admin.roles');
  const locale = useLocale();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      
      if (data.success) {
        setUsers(data.users);
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
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(t('updateRoleSuccess'));
        fetchUsers();
      } else {
        toast.error(data.error || tc('error'));
      }
    } catch {
      toast.error(tc('error'));
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(t('updateStatusSuccess'));
        fetchUsers();
      } else {
        toast.error(data.error || tc('error'));
      }
    } catch {
      toast.error(tc('error'));
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.account.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    account: '',
    name: '',
    email: '',
    password: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer',
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t('createSuccess'));
        setIsDialogOpen(false);
        setFormData({
          account: '',
          name: '',
          email: '',
          password: '',
          role: 'viewer',
        });
        fetchUsers();
      } else {
        toast.error(data.error || tc('error'));
      }
    } catch {
      toast.error(tc('error'));
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-500">{t('active')}</Badge>
    ) : (
      <Badge variant="secondary">{t('disabled')}</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">{t('list')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('listDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 搜索栏 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  {t('addUser')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border sm:max-w-[425px]">
                <form onSubmit={handleCreateUser}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">{t('addUserTitle')}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      {t('addUserDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="account" className="text-right text-foreground/80">
                        {t('account')}
                      </Label>
                      <Input
                        id="account"
                        value={formData.account}
                        onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                        className="col-span-3 bg-background border-border"
                        placeholder={t('accountPlaceholder')}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right text-foreground/80">
                        {t('name')}
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="col-span-3 bg-background border-border"
                        placeholder={t('namePlaceholder')}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right text-foreground/80">
                        {t('email')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="col-span-3 bg-background border-border"
                        placeholder={t('emailPlaceholder')}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right text-foreground/80">
                        {t('password')}
                      </Label>
                      <PasswordInput
                        id="password"
                        value={formData.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                        className="col-span-3 bg-background border-border"
                        placeholder={t('passwordPlaceholder')}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right text-foreground/80">
                        {t('role')}
                      </Label>
                      <div className="col-span-3">
                        <Select
                          value={formData.role}
                          onValueChange={(v: 'admin' | 'editor' | 'viewer') => setFormData({ ...formData, role: v })}
                        >
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder={t('selectRole')} />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="admin">{tr('admin')}</SelectItem>
                            <SelectItem value="editor">{tr('editor')}</SelectItem>
                            <SelectItem value="viewer">{tr('viewer')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border">
                      {tc('cancel')}
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {tc('confirm')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* 用户表格 */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{tc('loading')}</div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="text-foreground">{t('account')}</TableHead>
                    <TableHead className="text-foreground">{t('name')}</TableHead>
                    <TableHead className="text-foreground">{t('email')}</TableHead>
                    <TableHead className="text-foreground">{t('role')}</TableHead>
                    <TableHead className="text-foreground">{t('status')}</TableHead>
                    <TableHead className="text-foreground">{t('createTime')}</TableHead>
                    <TableHead className="text-right text-foreground">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {tc('noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{user.account}</TableCell>
                        <TableCell className="text-foreground">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-[120px] bg-background border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="admin">{tr('admin')}</SelectItem>
                              <SelectItem value="editor">{tr('editor')}</SelectItem>
                              <SelectItem value="viewer">{tr('viewer')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString(locale)}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                              >
                                {user.status === 'active' ? (
                                  <>
                                    <Ban className="h-4 w-4" />
                                    {t('disable')}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    {t('enable')}
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">
                                  {user.status === 'active' ? t('confirmDisableTitle') : t('confirmEnableTitle')}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  {user.status === 'active' 
                                    ? t('confirmDisableDesc', { name: user.name, account: user.account }) 
                                    : t('confirmEnableDesc', { name: user.name, account: user.account })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border">{tc('cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleStatusToggle(user.id, user.status)}
                                  className={user.status === 'active' ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}
                                >
                                  {tc('confirm')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
