export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  reportFiled: boolean;
}

export interface Funding {
  id: string;
  source: string;
  amount: number;
  expenses: Expense[];
  deadline?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  assigneeId?: string;
  dueDate?: string;
  description?: string;
  parentType?: 'writing' | 'experiment';
  parentId?: string;
  parentTitle?: string;
}

export interface Researcher {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  studentID?: string;
  tasks: string[]; // Task IDs
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
