'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { UserPlus, UserMinus, Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  userName: string;
  userEmail: string;
  userAvatar?: string;
  joinedAt: string;
}

export function ProjectMembers({ identify }: { identify: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'editor' | 'viewer'>('editor');

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
        toast.error('无法加载成员列表');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  }, [identify]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      setIsAdding(true);
      const res = await fetch(`/api/projects/${identify}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, role: newRole }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('成员添加成功');
        setNewEmail('');
        // 刷新列表
        const resList = await fetch(`/api/projects/${identify}/members`);
        const dataList = await resList.json();
        if (dataList.success) setMembers(dataList.members);
      } else {
        toast.error(data.error || '添加失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('确定要移除该成员吗？')) return;

    try {
      const res = await fetch(`/api/projects/${identify}/members/${memberId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('成员已移除');
        setMembers(prev => prev.filter(m => m.id !== memberId));
      } else {
        toast.error(data.error || '移除失败');
      }
    } catch {
      toast.error('网络错误');
    }
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    try {
      const res = await fetch(`/api/projects/${identify}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('角色已更新');
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: role as 'owner' | 'editor' | 'viewer' } : m));
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch {
      toast.error('网络错误');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <ShieldAlert className="h-4 w-4 text-rose-500" />;
      case 'editor': return <ShieldCheck className="h-4 w-4 text-primary" />;
      default: return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />
            添加成员
          </CardTitle>
          <CardDescription className="text-muted-foreground">邀请其他用户参与该项目的文档编写</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMember} className="flex gap-4 items-end">
            <div className="flex-1 grid w-full items-center gap-1.5">
              <Label htmlFor="email" className="text-foreground/80">用户邮箱</Label>
              <Input
                id="email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-muted/50 border-border text-foreground"
              />
            </div>
            <div className="w-[180px] grid items-center gap-1.5">
              <Label className="text-foreground/80">角色权限</Label>
              <Select value={newRole} onValueChange={(v: 'editor' | 'viewer') => setNewRole(v)}>
                <SelectTrigger className="bg-muted/50 border-border text-foreground">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="editor">编辑者 (可编辑)</SelectItem>
                  <SelectItem value="viewer">观察者 (仅查看)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isAdding || !newEmail} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : '邀请'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">成员列表</CardTitle>
          <CardDescription className="text-muted-foreground">管理目前参与项目的编辑人员</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-border">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground font-medium">用户</TableHead>
                <TableHead className="text-muted-foreground font-medium">角色</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="border-border hover:bg-accent/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={member.userAvatar} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {member.userName?.substring(0, 1) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{member.userName}</span>
                        <span className="text-xs text-muted-foreground">{member.userEmail}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      {member.role === 'owner' ? (
                        <span className="text-sm font-medium text-rose-500">所有者</span>
                      ) : (
                        <Select
                          value={member.role}
                          onValueChange={(v) => handleUpdateRole(member.id, v)}
                        >
                          <SelectTrigger className="h-8 w-[100px] border-none bg-transparent hover:bg-accent p-0 focus:ring-0 text-foreground/80">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="editor">编辑者</SelectItem>
                            <SelectItem value="viewer">观察者</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
