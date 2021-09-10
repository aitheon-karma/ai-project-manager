import { Component, OnInit, Input, EventEmitter, Output, HostListener } from '@angular/core';
import { FileViewerService } from './service/file-viewer.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'ai-file-viewer',
  templateUrl: './file-viewer.component.html',
  styleUrls: ['./file-viewer.component.scss']
})
export class FileViewerComponent implements OnInit {
  subscriptions: Subscription[] = [];
  index: number;
  file: any;

  constructor(private fileViewerService: FileViewerService,
              public sanitizer: DomSanitizer) { }
  @Input() files: any[];
  @Output() onCloseViewer: EventEmitter<boolean> = new EventEmitter<boolean>();

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.keyCode === 39) {
      this.nextImage();
    }
    if (event.keyCode === 37) {
      this.prevImage();
    }
  }

  ngOnInit() {
    this.fileViewerService.viewFileModalStatusChanged.subscribe(file => {
      this.index = this.files.indexOf(file);
    });
  }

  nextImage() {
    if (this.index === this.files.length - 1) {
      this.index = 0;
    } else {
      this.index = this.index + 1;
    }
  }

  prevImage() {
    if (this.index === 0) {
      this.index = this.files.length - 1;  
    } else {
      this.index = this.index - 1;
    }
  }

  close() {
    this.onCloseViewer.emit(true);
  }
}