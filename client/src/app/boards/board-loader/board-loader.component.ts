import { Component, OnInit } from '@angular/core';
import { BoardsRestService, ProjectTasksRestService } from '@aitheon/project-manager';
import { ActivatedRoute, Router} from '@angular/router';
import { BoardType } from 'src/app/shared/constants/enums';

@Component({
  selector: 'ai-board-loader',
  templateUrl: './board-loader.component.html',
  styleUrls: ['./board-loader.component.scss']
})
export class BoardLoaderComponent implements OnInit {

  constructor(private boardService: BoardsRestService,
    private router: Router,
    private projectTaskService: ProjectTasksRestService,
    private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    const { projectId } = this.activatedRoute.parent.snapshot.params;
    const { task } = this.activatedRoute.snapshot.queryParams;

    if (task) {
        this.projectTaskService.findByOrchestratorTask(projectId, task).subscribe(projectTask => {
          this.router.navigate([`/projects/${projectId}/boards/${projectTask.board}`], {queryParams: {task: projectTask.reference} });
        });
    } else {
      this.boardService.getByProjectId(projectId).subscribe(boards => {
        const mainBoard = boards.find(b => b.type === BoardType.MAIN);
        this.router.navigate([`/projects/${projectId}/boards/${mainBoard._id}`]);
      });
    }
  }
}
