export interface ProjectMetadata {
  title: string;
  pi: string;
  institution: string;
  description: string;
  currency: string;
  startDate?: string;
  endDate?: string;
}

export const DEFAULT_META: ProjectMetadata = {
  title: 'Research Project',
  pi: '',
  institution: '',
  description: '',
  currency: '$',
};

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  reportFiled: boolean;
  category?: string;
}

export interface Funding {
  id: string;
  source: string;
  amount: number;
  expenses: Expense[];
  deadline?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'blocked' | 'done';
  assigneeId?: string;
  dueDate?: string;
  description?: string;
  parentType?: 'writing' | 'experiment';
  parentId?: string;
  parentTitle?: string;
  // File association — fileName is persisted; handle is transient (lost on reload)
  linkedFileName?: string;
  linkedFileHandle?: FileSystemFileHandle;
}

export interface Researcher {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  studentID?: string;
  tasks: string[];
}

export interface WritingProject {
  id: string;
  title: string;
  wordCount: number;
  targetWordCount: number;
  status: 'drafting' | 'review' | 'final';
  taskId?: string;
  folderHandle?: FileSystemDirectoryHandle;
}

export interface Experiment {
  id: string;
  title: string;
  date: string;
  summary: string;
  codeLink?: string;
  status: 'planned' | 'running' | 'completed';
  taskId?: string;
}

export interface LogEntry {
  id: string;
  date: string;
  content: string;
}
