import { create } from 'zustand';

// 项目类型
export interface ProjectInfo {
  id: string;
  name: string;
  identify: string;
  description?: string;
  cover?: string;
  logo?: string;
  favicon?: string;
  visibility: 'public' | 'private' | 'password';
  ownerId: string;
  ownerName?: string;
  documentCount?: number;
  memberCount?: number;
  editorType: 'markdown' | 'richtext';
  createdAt: Date;
  updatedAt: Date;
}

// 项目状态类型
interface ProjectState {
  projects: ProjectInfo[];
  currentProject: ProjectInfo | null;
  isLoading: boolean;
  
  // Actions
  setProjects: (projects: ProjectInfo[]) => void;
  setCurrentProject: (project: ProjectInfo | null) => void;
  setLoading: (loading: boolean) => void;
  addProject: (project: ProjectInfo) => void;
  updateProject: (id: string, data: Partial<ProjectInfo>) => void;
  removeProject: (id: string) => void;
  fetchProject: (identify: string) => Promise<void>;
}

// 项目状态 Store
export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  setProjects: (projects) => set({ projects, isLoading: false }),

  setCurrentProject: (currentProject) => set({ currentProject }),

  setLoading: (isLoading) => set({ isLoading }),

  addProject: (project) => set((state) => ({
    projects: [project, ...state.projects],
  })),

  updateProject: (id, data) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === id ? { ...p, ...data } : p
    ),
    currentProject:
      state.currentProject?.id === id
        ? { ...state.currentProject, ...data }
        : state.currentProject,
  })),

  removeProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id),
    currentProject:
      state.currentProject?.id === id ? null : state.currentProject,
  })),
  
  fetchProject: async (identify) => {
    const state = useProjectStore.getState();
    
    // 如果正在加载同一个项目，或者项目已经加载且标识匹配，则跳过
    if (state.isLoading && state.currentProject?.identify === identify) return;
    if (state.currentProject?.identify === identify && !state.isLoading) return;
    
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/projects/${identify}`);
      const data = await res.json();
      if (res.ok && data.project) {
        set({ currentProject: data.project });
      } else {
        set({ currentProject: null });
        // 不在这里抛出错误，而是静默失败或由组件处理，防止触发多余的重绘
      }
    } catch (error) {
      console.error('Fetch project error:', error);
      set({ currentProject: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
