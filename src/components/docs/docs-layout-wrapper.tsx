'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DocsSidebar } from './docs-sidebar';
import { DocumentTreeNode } from '@/stores/document-store';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DocsLayoutWrapperProps {
  children: React.ReactNode;
  documents: DocumentTreeNode[];
  projectIdentify: string;
}

export function DocsLayoutWrapper({ children, documents, projectIdentify }: DocsLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex flex-1 relative">
      <DocsSidebar 
        documents={documents} 
        projectIdentify={projectIdentify}
        isOpen={isSidebarOpen}
      />
      
      {/* 遮罩层 - 仅在移动端侧边栏开启时显示 */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={cn(
          "fixed z-40 top-1/2 -translate-y-1/2 h-12 w-4 flex items-center justify-center rounded-r-[12px] bg-[#E5E6EB] hover:bg-[#dbdce0] text-[#737D89] transition-all duration-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
        )}
        style={{ left: isSidebarOpen ? '280px' : '0' }}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      <main 
        className={cn(
          "flex-1 w-full min-w-0 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "lg:pl-[280px]" : "pl-0"
        )}
      >
         {children}
      </main>
    </div>
  );
}
