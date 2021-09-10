import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  triggerModalOpen = new Subject<{
    type: string,
    data?: any,
	}>();

  public openModal(type: string, data?: any) {
    this.triggerModalOpen.next({
      type,
      data,
    });
  }
}
