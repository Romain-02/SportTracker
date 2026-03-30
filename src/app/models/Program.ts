export interface ProgramRow {
  id: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  isArchived: boolean | number;
}

export interface Program {
  id: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  isArchived: boolean;
  trainingIds?: number[];
}

export interface ProgramForm {
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isArchived?: boolean;
  trainingIds?: number[];
}

export type Programs = Program[];
