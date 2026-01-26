'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DocumentTreeNode } from '@/stores/document-store';

interface DocsSidebarProps {
  documents: DocumentTreeNode[];
  projectIdentify: string;
  isOpen?: boolean;
}

function DocsTreeItem({ 
  node, 
  level = 0, 
  projectIdentify
}: { 
  node: DocumentTreeNode & { children?: DocumentTreeNode[] };
  level?: number;
  projectIdentify: string;
}) {
  const pathname = usePathname();
  // Default not expanded
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  // Calculate active state
  // content identify could be the id or the identify field.
  // The url is /docs/[projectIdentify]/[docIdentify]
  const docSlug = node.identify || node.id;
  const targetPath = `/docs/${projectIdentify}/${docSlug}`;
  // specific matching: pathname might exactly match or be just equal
  const isActive = pathname === targetPath;

  return (
    <div className="select-none">
      <Link 
        href={targetPath}
        className={cn(
          "group flex items-center py-3 transition-colors relative text-sm",
          isActive 
            ? "bg-[#E1EBFD] text-[#2F54EB] dark:bg-blue-950/30 dark:text-blue-400 font-medium" 
            : "text-muted-foreground hover:text-[#666] hover:bg-[#EBECEF]"
        )}
        style={{ paddingLeft: `${(level * 12) + 4}px` }}
      >

        {/* Toggle Arrow */}
        <div 
          className={cn(
            "mr-2 h-4 w-4 shrink-0 flex items-center justify-center cursor-pointer transition-transform duration-200",
            !hasChildren && "invisible",
            expanded ? "rotate-90" : ""
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={cn(isActive ? "text-blue-600" : "text-muted-foreground/70")}>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>

        <span className="truncate leading-none">{node.title}</span>
      </Link>

      {hasChildren && expanded && (
        <div className="mt-0.5">
          {node.children!.map((child) => (
            <DocsTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              projectIdentify={projectIdentify}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocsSidebar({ documents, projectIdentify, isOpen = true }: DocsSidebarProps) {
  const [search, setSearch] = useState('');

  // ... filterNodes stays same ...
  const filterNodes = (nodes: DocumentTreeNode[], query: string): DocumentTreeNode[] => {
    return nodes.reduce((acc, node) => {
      const matches = node.title.toLowerCase().includes(query.toLowerCase());
      const filteredChildren = node.children ? filterNodes(node.children, query) : [];
      
      if (matches || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren
        });
      }
      return acc;
    }, [] as DocumentTreeNode[]);
  };

  const filteredDocs = search ? filterNodes(documents, search) : documents;

  return (
    <aside 
      className={cn(
        "w-[280px] flex-col fixed inset-y-0 z-30 flex top-[54px] bg-[#F7F8FA] transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="pt-[5px] px-[5px] pb-[10px]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="pl-9 bg-white border-transparent hover:bg-white/80 focus:bg-white h-9 rounded-full transition-colors"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 py-2">
        {filteredDocs.length > 0 ? (
          <div className="px-1">
            {filteredDocs.map((doc) => (
              <DocsTreeItem
                key={doc.id}
                node={doc}
                projectIdentify={projectIdentify}
              />
            ))}
          </div>
        ) : (
          <div className="px-6 py-4 text-sm text-muted-foreground text-center">
            No results found.
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
