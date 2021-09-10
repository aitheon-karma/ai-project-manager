import { TestBed } from '@angular/core/testing';

import { FileViewerService } from './file-viewer.service';

describe('FileViewerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FileViewerService = TestBed.get(FileViewerService);
    expect(service).toBeTruthy();
  });
});
