import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class FileViewerService {

  constructor() { }

  private viewFileModalStatusChange$ = new Subject<any>();
  private fileToViewChanges$ = new Subject<any>();

  get viewFileModalStatusChanged() {
    return this.viewFileModalStatusChange$.asObservable();
  }

  get filesToViewChanged() {
    return this.fileToViewChanges$.asObservable();
  }

  changeStatus(file: any) {
    this.viewFileModalStatusChange$.next(file);
  }

  changeFilesToView() {
    this.fileToViewChanges$.next();
  }
}
