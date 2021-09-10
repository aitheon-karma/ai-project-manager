import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { ProjectsRestService, Project } from '@aitheon/project-manager';
import { ToastrService } from 'ngx-toastr';
import { RouterStateService } from 'src/app/shared/services/router-state.service';
import * as _ from 'lodash';

@Component({
  selector: 'ai-project-settings-workspaces',
  templateUrl: './project-settings-workspaces.component.html',
  styleUrls: ['./project-settings-workspaces.component.scss']
})
export class ProjectSettingsWorkspacesComponent implements OnInit {

  projectId: string;
  workspaces: any = [];
  loadingProject = false;
  isButtonDisabled = true;
  workspaceForm: FormGroup;
  project: Project = {};
  selectedWorkspaces: any = [];

  constructor(private projectsRestService: ProjectsRestService,
    private formBuilder: FormBuilder,
    private toastrService: ToastrService,
    private routerStateService: RouterStateService
  ) { }

  ngOnInit() {
    this.buildForm();
    this.buildWorkspaceList();
    this.getProject();
  }


  getProject() {
    this.loadingProject = true;
    this.routerStateService.params$.subscribe((params: any) => {
      this.projectId = params.projectId;
      this.projectsRestService.getById(this.projectId).subscribe((project: Project) => {
        this.loadingProject = false;
        this.project = project;

        this.workspaces.forEach((workspace: any) => {
          const style = workspace.style.split('url(\'/');
          if (style.length) {
            workspace.style = style[0] + 'url(\'' + style[1];
          }

          this.workspace.push(this.formBuilder.group({
            title: workspace.title,
            value: workspace.value,
            description: workspace.description,
            style: workspace.style,
            check: new FormControl({
              value: _.includes(this.project.workspaces, workspace.value),
              disabled: (workspace.value !== 'KANBAN' ? true : false)
            })
          }));
        });

      }, (error: any) => {
        this.loadingProject = false;
        this.toastrService.error(`${error || error.statusText}`);
      });

    });
  }

  buildForm() {
    this.workspaceForm = this.formBuilder.group({
      workspace: this.formBuilder.array([])
    });
  }

  buildWorkspaceList() {
    this.workspaces = [
      { title: 'Kanban', value: 'KANBAN', description: 'A Kanban board is a work and workflow visualization tool that enables you to optimize the flow of your work', style: 'linear-gradient(-90deg, rgba(26, 26, 26, 0.6) 0%, rgb(43, 43, 43) 100%),url(\'/assets/tile_pattern_1.png\')' },
      { title: 'Gantt', value: 'GANTT_CHART', description: 'Gantt chart provides a graphical illustration of a schedule that helps to plan, coordinate, and track specific tasks in a project. ', style: 'linear-gradient(-90deg, rgba(26, 26, 26, 0.6) 0%, rgb(43, 43, 43) 100%),url(\'/assets/tile_pattern_2.png\')' },
      { title: 'Mindmap', value: 'MINDMAP', description: 'It is a visual thinking tool that helps structuring information, helping you to better analyze, comprehend, synthesize and recall', style: 'linear-gradient(-90deg, rgba(26, 26, 26, 0.6) 0%, rgb(43, 43, 43) 100%),url(\'/assets/tile_pattern_3.png\')' }
    ];
  }

  updateProjectWorkspace() {
    if (this.workspaceForm.invalid) {
      return;
    }

    if (this.selectedWorkspaces.length == 0) {
      this.toastrService.error('Please select at least one workspace.');
      return;
    }

    this.isButtonDisabled = true;
    this.projectsRestService.update(this.projectId, { workspaces: this.selectedWorkspaces }).subscribe((project: Project) => {
      this.isButtonDisabled = false;
      this.project = project;
      this.onValueChange();
      this.toastrService.success(` Project workspace updated`);
    }, (error: any) => {
      this.isButtonDisabled = false;
      this.toastrService.error(`${error || error.statusText}`);
    });
  }

  onValueChange() {
    this.isButtonDisabled = _.isEqual(_.sortBy(this.selectedWorkspaces), _.sortBy(this.project.workspaces));
  }

  get workspace() {
    return this.workspaceForm.get('workspace') as FormArray;
  }

  onWorkspaceClick(control: any) {
    // disabled for now
    return;
    control.get('check').setValue(!control.value.check);
    this.selectedWorkspaces = this.workspace.controls.map((control: any) => control.value.check && control.value.value);
    this.selectedWorkspaces = this.selectedWorkspaces.filter((selectedWorkspace: string) => selectedWorkspace);
    this.onValueChange();
  }
}
