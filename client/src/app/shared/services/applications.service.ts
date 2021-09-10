import { Project } from '@aitheon/creators-studio';
import { GraphsRestService } from '@aitheon/system-graph';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';

export enum ReferenceType {
  SPECIAL = 'SPECIAL'
}

export enum ApplicationType {
  APPLICATION = 'APPLICATION',
  DASHBOARD = 'DASHBOARD',
  AUTOMATION = 'AUTOMATION',
  DEVICE_NODE = 'DEVICE_NODE',
}

export enum NodeStatus {
  PENDING = 'PENDING',
  TERMINATED = 'TERMINATED',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
  SAVED = 'SAVED'
}

export interface GraphData {
  graphId: string;
  status: NodeStatus;
  applications: {
    graphNodeId: string;
    project: Project;
    status: NodeStatus;
    isLatest: boolean;
  }[]
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationsService {
  constructor(
    private graphsRestService: GraphsRestService,
  ) {}

  public getApplications(
    referenceId: string,
    referenceType: ReferenceType,
    applicationType?: ApplicationType | ApplicationType[],
  ): Observable<GraphData> {
    return this.graphsRestService.getReferenceType(referenceId, referenceType, true, true)
      .pipe(
        take(1),
        map(graph => {
          const { graphNodes = [] } = graph as any;
          let applications = graphNodes.filter(graphNode => graphNode?.release?.project?.projectType)
            .map(graphNode => ({
              isLatest: graphNode?.isLatest,
              graphNodeId: graphNode._id,
              device: graphNode?.device,
              status: graphNode?.status,
              version: graphNode?.release?.tag,
              project: graphNode.release.project,
              uiElements: graphNode?.uiElements,
            }));
          if (applicationType) {
            applications = applications.filter(app => {
              if (Array.isArray(applicationType)) {
                return applicationType.includes(app.project?.projectSubType) ||
                  applicationType.includes(app.project?.projectType);
              }
              return app.project?.projectSubType?.includes(applicationType) ||
                app.project?.projectSubType?.includes(applicationType);
            });
          }
          return {
            graphId: graph._id,
            applications,
            status: graph.status
          };
        }));
  }

  public getApplicationsByService(
    applicationType?: ApplicationType | ApplicationType[],
  ): Observable<GraphData> {
    return this.graphsRestService.getByService('PROJECT_MANAGER')
      .pipe(
        take(1),
        map(graph => {
          const { graphNodes = [] } = graph as any;
          let applications = graphNodes.filter(graphNode => graphNode?.node?.project?.projectType)
            .map(graphNode => ({
              isLatest: graphNode?.isLatest,
              graphNodeId: graphNode._id,
              device: graphNode?.device,
              status: graphNode?.status,
              version: graphNode?.release?.tag,
              project: graphNode.node.project,
              uiElements: graphNode?.uiElements,
            }));
          if (applicationType) {
            applications = applications.filter(app => {
              if (Array.isArray(applicationType)) {
                return applicationType.includes(app.project?.projectSubType) ||
                  applicationType.includes(app.project?.projectType);
              }
              return app.project?.projectSubType?.includes(applicationType) ||
                app.project?.projectSubType?.includes(applicationType);
            });
          }
          return {
            graphId: graph._id,
            applications,
            status: graph.status
          };
        }));
  }
}
