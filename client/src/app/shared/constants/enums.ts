export enum DashboardType {
  DASHBOARD = 'DASHBOARD',
  PROJECTS = 'PROJECTS',
  EPICS = 'EPICS',
  ARCHIVED = 'ARCHIVED',
  ARCHIVED_EPICS = 'ARCHIVED_EPICS',
  SETTINGS = 'SETTINGS'
}

export enum TaskType {
  TASK = 'TASK',
  STORY = 'STORY',
  ISSUE = 'ISSUE'
}

export enum BoardType {
  ISSUE = 'ISSUE',
  MAIN = 'MAIN',
  CUSTOM = 'CUSTOM'
}

export enum State {
  BACKLOG = 'BACKLOG',
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

export enum EpicStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

export enum SubscriptionType {
  STAGE = 'STAGE',
  TASK = 'TASK',
  LABEL = 'LABEL'
}
