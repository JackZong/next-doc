'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Trash2, Eye, FileText, Image as ImageIcon, File } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';

interface Attachment {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  projectName: string;
  uploaderName: string;
  createdAt: string;
}

export function AttachmentManagement() {
  const t = useTranslations('Admin.attachments');
  const tc = useTranslations('Common');
  const locale = useLocale();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAttachments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/attachments');
      const data = await res.json();
      
      if (data.success) {
        setAttachments(data.attachments);
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
    fetchAttachments();
  }, [fetchAttachments]);

  const handleDeleteAttachment = async (attachmentId: string, attachmentName: string) => {
    try {
      setDeletingId(attachmentId);
      const res = await fetch(`/api/admin/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(t('deleteSuccess', { name: attachmentName }));
        fetchAttachments();
      } else {
        toast.error(data.error || tc('error'));
      }
    } catch {
      toast.error(tc('error'));
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAttachments = attachments.filter(attachment =>
    attachment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attachment.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attachment.uploaderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // 获取文件类型图标
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  // 获取文件类型Badge
  const getFileTypeBadge = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Badge variant="default">{t('typeLabels.image')}</Badge>;
    } else if (mimeType.includes('pdf')) {
      return <Badge variant="secondary">{t('typeLabels.pdf')}</Badge>;
    } else if (mimeType.includes('document') || mimeType.includes('word')) {
      return <Badge variant="outline">{t('typeLabels.document')}</Badge>;
    } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return <Badge variant="outline">{t('typeLabels.sheet')}</Badge>;
    }
    return <Badge variant="secondary">{t('typeLabels.other')}</Badge>;
  };

  // 判断是否为图片
  const isImage = (mimeType: string) => mimeType.startsWith('image/');

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
          </div>

          {/* 附件表格 */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{tc('loading')}</div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="text-foreground">{t('fileName')}</TableHead>
                    <TableHead className="text-foreground hidden sm:table-cell">{t('type')}</TableHead>
                    <TableHead className="text-foreground">{t('size')}</TableHead>
                    <TableHead className="text-foreground hidden md:table-cell">{t('project')}</TableHead>
                    <TableHead className="text-foreground hidden lg:table-cell">{t('uploader')}</TableHead>
                    <TableHead className="text-foreground hidden xl:table-cell">{t('time')}</TableHead>
                    <TableHead className="text-right text-foreground">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttachments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? t('noMatchingAttachments') : tc('noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttachments.map((attachment) => (
                      <TableRow key={attachment.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            {getFileIcon(attachment.mimeType)}
                            <span className="truncate max-w-[120px] sm:max-w-[200px]">{attachment.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{getFileTypeBadge(attachment.mimeType)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatFileSize(attachment.size)}
                        </TableCell>
                        <TableCell className="text-foreground text-sm hidden md:table-cell">{attachment.projectName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">{attachment.uploaderName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden xl:table-cell">
                          {new Date(attachment.createdAt).toLocaleDateString(locale)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isImage(attachment.mimeType) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="gap-2">
                                    <Eye className="h-4 w-4" />
                                    {t('preview')}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-border max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle className="text-foreground">{attachment.name}</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                      {formatFileSize(attachment.size)} · {attachment.mimeType}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="relative w-full h-[500px] bg-muted/20 rounded-lg overflow-hidden">
                                    <Image
                                      src={attachment.path}
                                      alt={attachment.name}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="gap-2 text-destructive hover:text-destructive"
                                  disabled={deletingId === attachment.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {tc('delete')}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                    <Trash2 className="h-5 w-5" />
                                    {t('confirmDeleteTitle')}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    {t('confirmDeleteDesc')}
                                    <br /><br />
                                    {t('fileName')}: <span className="font-mono font-semibold text-foreground">{attachment.name}</span>
                                    <br />
                                    {t('size')}: <span className="font-semibold text-foreground">{formatFileSize(attachment.size)}</span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-border">{tc('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteAttachment(attachment.id, attachment.name)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                  >
                                    {tc('confirm')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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
