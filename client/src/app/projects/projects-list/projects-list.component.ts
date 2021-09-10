import { Component, OnInit, OnChanges, ViewChild, TemplateRef, HostListener, Input, SimpleChanges,
         ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ProjectsRestService, Project, BoardsRestService, Board, ProjectsOrderRestService } from '@aitheon/project-manager';
import { ToastrService } from 'ngx-toastr';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { AuthService } from '@aitheon/core-client';
import { GenericConfirmComponent } from '../../shared/components/generic-confirm/generic-confirm.component';
import { ProjectStatus } from 'src/app/shared/constants/enums';
import { PlatformLocation } from '@angular/common';
import * as _ from 'lodash';

@Component({
  selector: 'ai-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsListComponent implements OnInit, OnChanges {
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;
  @ViewChild('projectModal') projectModal: TemplateRef<any>;
  @ViewChild('todoIssueTaskState') todoIssueTaskState: ElementRef;
  @ViewChild('todoTaskState') todoTaskState: ElementRef;
  @ViewChild('inProgressState') inProgressState: ElementRef;
  @ViewChild('doneState') doneState: ElementRef;
  @ViewChild('projectOrderModal') projectOrderModal: TemplateRef<any>;
  @Input() status: string;
  projectUrl: any;
  projects: any[];
  loading: any = true;
  organizationId: string;
  projectModalRef: BsModalRef;
  projectOrderModalRef: BsModalRef;
  selectedId: any;
  list: any = [];
  project: any;
  isActive = false;
  currentUser: any;
  data: any = [];
  activeView = localStorage.getItem('activeView') || 'listView';
  avatarColors = ['#E96058', '#ED9438', '#F5BA06', '#67B231', '#1AC0C9', '#589BE9', '#6278C4', '#8C58E9', '#CA58E9', '#F39ABA'];
  noProjects = false;
  priorityList = [];
  modalHeader: string;
  confirmTextBtn: string;
  otherMembers: any;
  modalIsOpen = false;
  orderModalIsOpen = false;
  genericIsOpen = false;
  allProjects: any;
  priorityFilterList: Project[];
  selectedPriority: number;
  activeProject: any;
  activeStatus: any;
  showTooltipForReorder = false;
  serviceUserRole = '';

  @HostListener('document:click', ['$event'])
  onClick() {
    this.closeAllMoreLists();
  }

  constructor(
    private projectsRestService: ProjectsRestService,
    private modalService: BsModalService,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService,
    private boardsRestService: BoardsRestService,
    private location: PlatformLocation,
    private cdr: ChangeDetectorRef,
    private projectsOrderService: ProjectsOrderRestService
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe((user: any) => {
      this.currentUser = user;
    });

    this.authService.activeOrganization.subscribe((org: any) => {
      this.organizationId = org._id;
      this.projectUrl = (this.router.url).split('/');
      this.projectUrl = this.projectUrl[this.projectUrl.length - 1];
      if (this.currentUser?.roles) {
        this.serviceUserRole = this.currentUser.roles.find(role => {
          return this.organizationId === role.organization._id;
        }).services.find(service => {
          return service.service === 'PROJECT_MANAGER';
        }).role as string;
      }
    });
    this.fillPriority();
    this.onLocationChange();
  }

  onLocationChange() {
    this.location.onPopState(() => {
      if (this.modalIsOpen) {
        this.onCloseDialog();
        history.go(1);
      } else if (this.genericIsOpen) {
        this.genericConfirm.hide();
        history.go(1);
      } else if (this.orderModalIsOpen) {
        this.closeOrderModal();
        history.go(1);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.status) {
      const status = changes.status.currentValue === 'PROJECTS' ? 'ACTIVE' : 'ARCHIVED';
      this.activeStatus = status;
      this.loadProjects(status);
    }
  }

  loadProjects(status: string) {
    this.loading = true;
    this.noProjects = false;
    this.list = [];
    return this.data = this.projectsRestService.list(status, false, true).subscribe((projects: Project[]) => {
      this.getProjects(projects);
      this.detectChanges();
    });
  }

  reorderProjects(orderedProjects: any) {
    this.loading = true;
    this.projectOrderModalRef.hide();
    this.loadProjects(this.activeStatus);
    this.toastr.success('Reordered successfully');
  }

  getRandomColor(index: number) {
    return this.avatarColors[index % this.avatarColors.length];
  }

  getProjects(projects: Project[]) {
    this.projects = projects;
    if (this.projects.length) {
      this.noProjects = false;
      const list = [];
      this.projects.forEach((element, index) => {
        const members = [];
        element.roles.forEach((role: any) => {
          this.otherMembers = '';
          members.push(...role.members);
          if (role.accessType === 'OWNER') {
            const isShared = role.organization._id !== this.organizationId;
            if (isShared) {
              element['sharedBy'] = role.organization.name;
            }
          }
          this.getOtherMembers(members);
        });
        element.members = members;
        let inProgressCount = element.progress.inProgress;
        let doneCount = element.progress.done;
        let issueCount = element.progress.issues;
        let todoTaskCount = element.progress.toDo;
        let totalTasksAndIssue = 0;
        element.generatedName = element.name.substr(0, 2).toUpperCase();
        totalTasksAndIssue = inProgressCount + doneCount + issueCount + todoTaskCount;
        todoTaskCount = (todoTaskCount / totalTasksAndIssue) * 100;
        issueCount = (issueCount / totalTasksAndIssue) * 100;
        doneCount = (doneCount / totalTasksAndIssue) * 100;
        inProgressCount = (inProgressCount / totalTasksAndIssue) * 100;
        element['progress'] = {
          totalTasksAndIssue: totalTasksAndIssue,
          todoTaskCount: { percentage: todoTaskCount.toFixed(2), background: '#7E7E7E' },
          issueCount: { percentage: issueCount.toFixed(2), background: '#E95F58' },
          doneCount: { percentage: doneCount.toFixed(2), background: '#67B231' },
          inProgressCount: { percentage: inProgressCount.toFixed(2), background: '#589BE9' }
        };
        element['moreBtnOpen'] = false;
        element.isAdmin = this.checkForAdminRights(element);

        list.push(element);
      });
      this.allProjects = list;

      if (this.activeStatus === 'ACTIVE') {
        this.projectsOrderService.list().subscribe(res => {
          this.list = list;
          if (res && res.projects) {
            this.list.map((project, index) => {
              if (res.projects.includes(project._id)) {
                const orderNumber = res.projects.indexOf(project._id);
                project['orderNumber'] = orderNumber;
              } else {
                const orderNumber = this.list.length + index;
                project['orderNumber'] = orderNumber;
              }
            });
            this.list.sort((a, b) => {
              return a.orderNumber - b.orderNumber;
            });
          } else {
            this.showTooltipForReorder = true;
          }
          this.loading = false;
          this.detectChanges();
          this.cdr.markForCheck();
        });
      } else {
        this.list = list;
        this.loading = false;
      }
    } else if (!this.projects.length) {
      this.loading = false;
      this.noProjects = true;
    }

    this.fillFilterPriority();
  }

  generateOrderInList(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.showTooltipForReorder = false;
    const finalArray = {projects: this.list.map(project => project._id)};
    this.projectsOrderService.createOrder(finalArray).subscribe();
  }

  getOtherMembers(projectMembers: any) {
    const arr = [];
    projectMembers.slice(5).forEach((member: any) => {
      const fullName = member.user.profile.firstName + ' ' + member.user.profile.lastName;
      arr.push(fullName);
    });
    this.otherMembers = arr.join(', ');
  }

  checkForAdminRights(project: Project) {
    const ownerRole = project.roles.find(role => role.accessType === 'OWNER');

    if (!ownerRole) {
      return false;
    }

    const ownerOrg = ownerRole.organization;

    if (this.organizationId !== ownerOrg._id) {
      return false;
    }

    const user = ownerRole.members.find(member => this.currentUser._id === member.user._id) as any;
    return user && user.role === 'ADMIN';
  }

  getInitails(name) {
    return ((name).substr(0, 2)).toUpperCase();
  }

  openCreateDialog() {
    document.querySelector('html').style.overflowY = 'hidden';
    this.modalIsOpen = true;
    this.projectModalRef = this.modalService.show(this.projectModal, {
      backdrop: 'static',
      class: 'custom-modal-size',
    });
  }

  goToSettings(project: Project, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['projects', `${project._id}`, 'settings', 'details']);
    document.querySelector('html').classList.add('highest-modal');
  }

  onCloseDialog() {
    document.querySelector('html').style.overflowY = 'scroll';
    this.modalIsOpen = false;
    this.projectModalRef.hide();
  }

  onSaved(project: Project) {
    this.loadProjects('ACTIVE');
    this.onCloseDialog();
  }

  onActionClick(event: any, id, moreBtnStatus) {
    event.stopPropagation();
    event.preventDefault();
    const selectedProject = this.list.find(project => {
      return project._id === id;
    });
    selectedProject.moreBtnOpen = !selectedProject.moreBtnOpen;
    if (selectedProject.moreBtnOpen === false) {
      this.closeAllMoreLists();
    }
    this.isActive = true;
    this.selectedId = id;
  }

  closeAllMoreLists() {
    this.list.map(project => {
      project.moreBtnOpen = false;
    });
  }

  getStyle(project, type) {
    if (type === 'TODO_TASK') {
      return {
        'width': project.progress.todoTaskCount.percentage + '%',
        'background': project.progress.todoTaskCount.background,
        'display': (this.isPercentageGreaterThanZero(project.progress.todoTaskCount.percentage) ? 'block' : 'none')
      };
    } else if (type === 'TODO_ISSUE') {
      return {
        'width': project.progress.issueCount.percentage + '%',
        'background': project.progress.issueCount.background,
        'display': (this.isPercentageGreaterThanZero(project.progress.issueCount.percentage) ? 'block' : 'none')
      };
    } else if (type === 'INPROGRESS') {
      return {
        'width': project.progress.inProgressCount.percentage + '%',
        'background': project.progress.inProgressCount.background,
        'display': (this.isPercentageGreaterThanZero(project.progress.inProgressCount.percentage) ? 'block' : 'none')

      };
    } else if (type === 'DONE') {
      return {
        'width': project.progress.doneCount.percentage + '%',
        'background': project.progress.doneCount.background,
        'display': (this.isPercentageGreaterThanZero(project.progress.doneCount.percentage) ? 'block' : 'none')
      };
    }
  }

  getProgressTextStyle(project: any, type: string) {
    const isEmptyProject = project.progress.totalTasksAndIssue === 0;
    let percentage = '';
    let color = '';

    switch (type) {
      case 'TODO_ISSUE':
        percentage = project.progress.issueCount.percentage;
        color = project.progress.issueCount.background;
        break;
      case 'TODO_TASK':
        percentage = project.progress.todoTaskCount.percentage;
        color = project.progress.todoTaskCount.background;
        break;
      case 'INPROGRESS':
        percentage = project.progress.inProgressCount.percentage;
        color = project.progress.inProgressCount.background;
        break;
      case 'DONE':
        percentage = project.progress.doneCount.percentage;
        color = project.progress.doneCount.background;
    }

    return {
      'width': this.getProgressTextWidth(percentage, isEmptyProject),
      color
    };
  }

  private getProgressTextWidth(percentage: string, isEmptyProject: boolean): string {
    const percentageAsNumber = parseFloat(percentage);

    return (isEmptyProject ? 25 : percentageAsNumber) + '%';
  }

  isProgressStateHidden(element: HTMLElement): boolean {
    return (element.offsetWidth < element.scrollWidth) || false;
  }

  isTodoIssueHidden(project): boolean {
    return !this.isPercentageGreaterThanZero(project.progress.issueCount.percentage);
  }

  isNextItemsHidden(project, type: string): boolean {
    switch (type) {
      case 'INPROGRESS':
        return !this.isPercentageGreaterThanZero(project.progress.doneCount.percentage);
      case 'TODO_TASK':
        return (
          !this.isPercentageGreaterThanZero(project.progress.doneCount.percentage) &&
          !this.isPercentageGreaterThanZero(project.progress.inProgressCount.percentage));
      case 'TODO_ISSUE':
        return (
          !this.isPercentageGreaterThanZero(project.progress.doneCount.percentage) &&
          !this.isPercentageGreaterThanZero(project.progress.inProgressCount.percentage) &&
          !this.isPercentageGreaterThanZero(project.progress.todoTaskCount.percentage));
    }
  }

  getTooltipInfo(project, type: string): string {
    let stateName = '';
    let numberOfTasks = '';

    switch (type) {
      case 'TODO_ISSUE':
        stateName = 'Issues';
        numberOfTasks = this.getCalculatedNumberOfTasks(project.progress.issueCount.percentage, project.progress.totalTasksAndIssue);
        break;
      case 'TODO_TASK':
        stateName = 'To Do';
        numberOfTasks = this.getCalculatedNumberOfTasks(project.progress.todoTaskCount.percentage, project.progress.totalTasksAndIssue);
        break;
      case 'INPROGRESS':
        stateName = 'In Progress';
        numberOfTasks = this.getCalculatedNumberOfTasks(project.progress.inProgressCount.percentage, project.progress.totalTasksAndIssue);
        break;
      case 'DONE':
        stateName = 'Done';
        numberOfTasks = this.getCalculatedNumberOfTasks(project.progress.doneCount.percentage, project.progress.totalTasksAndIssue);
        break;
    }

    return `${stateName}: ${numberOfTasks}`;
  }

  private getCalculatedNumberOfTasks(percentage: string, totalTasks: number): string {
    const percentageValue = parseInt(percentage);
    const numberOfTasks = parseInt((percentageValue / 100 * totalTasks).toFixed(0));

    return numberOfTasks ? `${numberOfTasks} Task${(numberOfTasks > 1) ? 's' : ''}` : 'No Tasks';
  }

  navigateToProject(event, project: Project) {
    event.preventDefault();

    this.boardsRestService.getByProjectId(project._id).subscribe((boards: Board[]) => {
      const mainBoard = boards.find((board: Board) => {
        return board.type === 'MAIN';
      });
      this.router.navigateByUrl(`projects/${project._id}/project-dashboard`);
    });
  }

  changeView(view: string) {
    this.activeView = view;
    localStorage.setItem('activeView', view);
  }

  updateProjectStatus(projectToUpdate: Project, status: string) {
    this.projectsRestService.updateProjectStatus(projectToUpdate._id, { status })
      .subscribe((project: Project) => {
        this.list = this.list.filter((item: any) => project._id !== item._id);

        const statusTab = (this.status === 'PROJECTS') ? 'ACTIVE' : 'ARCHIVED';
        let toastrMessage = '';

        switch (project.status) {
          case 'ACTIVE':
            toastrMessage = `Project \"${project.name}\" has been successfully activated`;
            break;
          case 'ARCHIVED':
            toastrMessage = `Project \"${project.name}\" has been successfully archived`;
            break;
          case 'DELETED':
            toastrMessage = `Project \"${project.name}\" has been successfully deleted`;
        }

        this.loadProjects(statusTab);
        this.toastr.success(toastrMessage);
      });
  }

  openUpdateProjectStatusModal(event: Event, project: Project, status: string) {
    event.stopPropagation();
    event.preventDefault();

    this.closeAllMoreLists();

    if (status === 'ARCHIVED') {
      this.modalHeader = 'Archive Project';
      this.confirmTextBtn = 'Archive';
    } else {
      this.modalHeader = 'Unarchive Project';
      this.confirmTextBtn = 'Unarchive';
    }

    if (status === 'DELETED') {
      this.modalHeader = 'Delete Project';
      this.confirmTextBtn = 'Delete';
    }

    this.genericIsOpen = true;
    this.genericConfirm.show({
      text: ' ',
      headlineText: this.modalHeader,
      confirmText: this.confirmTextBtn,
      callback: () => {
        this.genericIsOpen = false;
        this.updateProjectStatus(project, status);
      }
    });
    setTimeout(() => {
      const q: any = document.getElementsByClassName('confirm-message');
      q[0].innerHTML = this.getStatusMessage(status, project.name);
    }, 0);
  }

  getStatusMessage(status: string, projectName: string): any {
    if (status === ProjectStatus.ARCHIVED) {
      return `Are you sure you want to archive project <span style="color: #fff;">"${projectName}"</span>? All tasks linked to this project will be archived.`;
    }
    if (status === ProjectStatus.DELETED) {
      return `Are you sure you want to delete project <span style="color: #fff;">"${projectName}"</span>? All tasks linked to this project will be deleted.`;
    }
    if (status === ProjectStatus.ACTIVE) {
      return `Are you sure you want to unarchive project <span style="color: #fff;">"${projectName}"</span>?`;
    }
  }

  fillPriority() {
    for (let i = 0; i <= 10; i++) {
      let label = '';
      switch (i) {
        case 0:
          label = `${i} - Lowest`;
          break;
        case 2:
          label = `${i} - Low`;
          break;
        case 5:
          label = `${i} - Medium`;
          break;
        case 8:
          label = `${i} - High`;
          break;
        case 10:
          label = `${i} - Highest`;
          break;
        default:
          label = i.toString();
          break;
      }

      this.priorityList.push({
        label,
        priority: i
      });
    }
    this.detectChanges();
  }

  prioritySelect(e: MouseEvent) {
    e.stopPropagation();
  }

  onPriorityChange(projectId: string, priority: number) {
    this.projectsRestService.update(projectId, { priority: priority }).subscribe(res => {
      this.fillFilterPriority();
      this.toastr.success(`Project Priority updated`);
    }, (error: any) => {
      this.toastr.error(`${error || error.statusText}`);
    });
    this.filterProjects(this.selectedPriority);
  }

  setTypeClass(projectType) {
    return {
      'project-card__type--private': projectType === 'PRIVATE',
      'project-card__type--public': projectType === 'PUBLIC'
    };
  }

  fillFilterPriority() {
    this.priorityFilterList = [];

    if (this.allProjects && this.allProjects.length > 0)  {

      this.allProjects.map(project => {
        this.priorityList.map(priority => {
          if (project.priority === priority.priority) {
            this.priorityFilterList.push(priority);
          }
        });
      });
    }
    this.priorityFilterList = _.uniqBy(_.orderBy(this.priorityFilterList, 'priority'), 'priority');
  }

  filterProjects(e) {
    if (e) {
      this.selectedPriority = e;
      this.list = [...this.allProjects];
      this.list = this.list.filter(project => {
        return project.priority === e.priority;
      });
    } else {
      this.selectedPriority = null;
      this.list = [...this.allProjects];
    }
  }

  private isPercentageGreaterThanZero(percent: string): boolean {
    return !!parseInt(percent);
  }

  openProjectOrderModal(e: Event, projectId: any) {
    e.preventDefault();
    e.stopPropagation();
    this.activeProject = projectId;
    this.orderModalIsOpen = true;
    this.projectOrderModalRef = this.modalService.show(this.projectOrderModal, {
      backdrop: 'static',
      class: 'modal-reorder-projects',
    });
  }

  closeOrderModal() {
    this.projectOrderModalRef.hide();
    this.orderModalIsOpen = false;
  }

  detectChanges(): void {
    try {
      this.cdr.detectChanges();
    } catch (e) {
    }
  }
}
