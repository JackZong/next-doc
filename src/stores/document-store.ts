import { create } from 'zustand';

// 文档树节点类型
export interface DocumentTreeNode {
  id: string;
  title: string;
  identify: string;
  parentId?: string;
  sort: number;
  status: 'draft' | 'published';
  children: DocumentTreeNode[];
}

// 文档详情类型
export interface DocumentDetail {
  id: string;
  projectId: string;
  parentId?: string;
  title: string;
  identify: string;
  content?: string;
  contentType: 'markdown' | 'richtext';
  sort: number;
  status: 'draft' | 'published';
  authorId: string;
  authorName?: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 文档状态类型
interface DocumentState {
  documents: DocumentTreeNode[];
  currentDocument: DocumentDetail | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  
  // Actions
  setDocuments: (documents: DocumentTreeNode[]) => void;
  setCurrentDocument: (document: DocumentDetail | null) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  updateCurrentContent: (content: string) => void;
  addDocument: (document: DocumentTreeNode, parentId?: string) => void;
  updateDocument: (id: string, data: Partial<DocumentTreeNode>) => void;
  removeDocument: (id: string) => void;
  moveDocument: (id: string, newParentId?: string, newSort?: number) => void;
}

// 递归更新文档树
function updateDocumentTree(
  nodes: DocumentTreeNode[],
  id: string,
  data: Partial<DocumentTreeNode>
): DocumentTreeNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, ...data };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: updateDocumentTree(node.children, id, data),
      };
    }
    return node;
  });
}

// 递归删除文档
function removeFromTree(
  nodes: DocumentTreeNode[],
  id: string
): DocumentTreeNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: removeFromTree(node.children, id),
    }));
}

// 递归添加文档到指定父节点
function addToTree(
  nodes: DocumentTreeNode[],
  document: DocumentTreeNode,
  parentId?: string
): DocumentTreeNode[] {
  if (!parentId) {
    return [...nodes, document];
  }
  
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...node.children, document],
      };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: addToTree(node.children, document, parentId),
      };
    }
    return node;
  });
}

// 文档状态 Store
export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocument: null,
  isLoading: false,
  isSaving: false,
  hasUnsavedChanges: false,

  setDocuments: (documents) => set({ documents, isLoading: false }),

  setCurrentDocument: (currentDocument) => set({ 
    currentDocument,
    hasUnsavedChanges: false,
  }),

  setLoading: (isLoading) => set({ isLoading }),

  setSaving: (isSaving) => set({ isSaving }),

  setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),

  updateCurrentContent: (content) => set((state) => ({
    currentDocument: state.currentDocument
      ? { ...state.currentDocument, content }
      : null,
    hasUnsavedChanges: true,
  })),

  addDocument: (document, parentId) => set((state) => ({
    documents: addToTree(state.documents, document, parentId),
  })),

  updateDocument: (id, data) => set((state) => ({
    documents: updateDocumentTree(state.documents, id, data),
    currentDocument:
      state.currentDocument?.id === id
        ? { ...state.currentDocument, ...data }
        : state.currentDocument,
  })),

  removeDocument: (id) => set((state) => ({
    documents: removeFromTree(state.documents, id),
    currentDocument:
      state.currentDocument?.id === id ? null : state.currentDocument,
  })),

  moveDocument: (id, newParentId, newSort) => set((state) => {
    // 找到要移动的文档
    const findNode = (nodes: DocumentTreeNode[]): DocumentTreeNode | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNode(node.children);
        if (found) return found;
      }
      return undefined;
    };
    
    const docToUpdate = findNode(state.documents);
    if (!docToUpdate) return state;

    // 从原位置删除
    let newDocs = removeFromTree(state.documents, id);
    
    // 更新属性
    const docToMove: DocumentTreeNode = { 
      ...docToUpdate, 
      sort: newSort !== undefined ? newSort : docToUpdate.sort, 
      parentId: newParentId 
    };

    // 添加到新位置
    newDocs = addToTree(newDocs, docToMove, newParentId);

    return { documents: newDocs };
  }),
}));
