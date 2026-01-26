'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Shield, Loader2, Mail, ShieldCheck, ShieldAlert, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatar: string | null;
}

export function ProjectSettingsMembers({ identify }: { identify: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/projects/${identify}/members`);
        const data = await res.json();
        if (data.success) {
          setMembers(data.members);
        }
      } catch {
        toast.error('加载成员列表失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [identify]);

  const updateRole = async (memberId: string, newRole: 'editor' | 'viewer') => {
    try {
      const res = await fetch(`/api/projects/${identify}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('权限已更新');
        setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch {
      toast.error('网络错误');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setIsInviting(true);
      const res = await fetch(`/api/projects/${identify}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || '邀请已发送');
        setInviteEmail('');
      } else {
        toast.error(data.error || '邀请失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setIsInviting(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/projects/${identify}/members/${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('已移除该成员');
        setMembers(members.filter(m => m.id !== memberId));
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch {
      toast.error('网络错误');
    }
  };

  const RoleDisplay = ({ role, memberId, isOwner }: { role: string; memberId: string; isOwner: boolean }) => {
    if (role === 'owner') {
      return (
        <div className="flex items-center gap-2 text-rose-500 font-semibold py-1.5 px-2 rounded-lg bg-rose-500/5 w-fit">
          <ShieldAlert className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">项目所有者</span>
        </div>
      );
    }

    return (
      <Select 
        value={role} 
        onValueChange={(v: 'editor' | 'viewer') => updateRole(memberId, v)}
        disabled={isOwner}
      >
        <SelectTrigger className="h-9 w-fit min-w-[110px] bg-muted/50 border-border hover:bg-muted/80 px-3 focus:ring-1 focus:ring-primary/20 transition-all">
          <div className="flex items-center gap-2">
            {role === 'editor' ? (
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            ) : (
              <Shield className="h-4 w-4 text-slate-400" />
            )}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border shadow-xl">
          <SelectItem value="editor" className="focus:bg-primary/10">编辑者</SelectItem>
          <SelectItem value="viewer" className="focus:bg-primary/10">查看者</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />
            邀请新成员
          </CardTitle>
          <CardDescription className="text-muted-foreground">通过邮箱邀请其他用户加入此项目</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email" className="sr-only">邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-10 bg-muted/50 border-border"
                  required
                />
              </div>
            </div>
            <div className="w-full sm:w-[140px] space-y-2">
              <Select value={inviteRole} onValueChange={(v: 'editor' | 'viewer') => setInviteRole(v)}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="editor">编辑者</SelectItem>
                  <SelectItem value="viewer">查看者</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isInviting} className="gap-2 shrink-0">
              {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              发送邀请
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5 text-primary" />
            成员列表
          </CardTitle>
          <CardDescription className="text-muted-foreground">管理目前参与项目的协作人员</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-muted/5">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40%]">用户</TableHead>
                    <TableHead className="w-[40%]">角色</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        暂无成员
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => {
                      const displayName = member.name || member.email.split('@')[0];
                      const initials = displayName.charAt(0).toUpperCase();

                      return (
                        <TableRow key={member.id} className="group hover:bg-muted/10 transition-colors border-border/50">
                          <TableCell>
                            <div className="flex items-center gap-3.5 py-1.5">
                              <div className="relative">
                                <Avatar className="h-10 w-10 border border-border shadow-sm">
                                  <AvatarImage src={member.avatar || undefined} />
                                  <AvatarFallback className="bg-linear-to-br from-primary/10 to-primary/5 text-primary text-sm font-bold">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                {member.role === 'owner' && (
                                  <div className="absolute -top-1 -right-1 bg-rose-500 rounded-full p-0.5 border-2 border-background">
                                    <ShieldAlert className="size-2 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                  {member.name || (
                                    <span className="text-muted-foreground/60 font-normal italic">未设置姓名</span>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground/80 truncate">
                                  {member.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <RoleDisplay role={member.role} memberId={member.id} isOwner={member.role === 'owner'} />
                          </TableCell>
                          <TableCell className="text-right">
                            {member.role !== 'owner' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="size-9 text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all rounded-xl border border-transparent hover:border-rose-500/20 shadow-none"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card border-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-foreground">
                                      确认移除成员
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground">
                                      您确定要从项目中移除 <span className="font-semibold">{member.name || member.email}</span> 吗？
                                      <br />
                                      移除后，该用户将失去对此项目的访问权限。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-border">取消</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeMember(member.id)}
                                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    >
                                      确认移除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
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
