export interface ConversationRecord {
  url: string;
  title?: string;
  parentUrl?: string;
  parentTitle?: string;
  projectIds?: string[];
  inRecents?: boolean;
  lastSeen?: number;
  placeholder?: boolean;
}

export interface ProjectRecord {
  id: string;
  title: string;
}

export interface FilterSettings {
  includeRecents: boolean;
  selectedProjectIds: string[] | null;
  panelWidth?: number;
}

export type ConversationMap = Record<string, ConversationRecord>;
export type ProjectMap = Record<string, ProjectRecord>;