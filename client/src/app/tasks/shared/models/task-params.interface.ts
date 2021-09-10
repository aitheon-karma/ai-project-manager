export interface TaskParams {
  taskReference?: string;
  epicId?: string;
  project: any;
  boardId?: string;
  order?: number;
  stageId?: string;
  parentReference?: string;
  callback?: (projectTask?: any) => void;
}
