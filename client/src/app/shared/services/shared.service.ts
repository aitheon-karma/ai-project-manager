import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  public loading = new Subject<boolean>();
  public refreshBoardData$ = new Subject<boolean>();
  public filtersDataReady$ = new Subject<any>();

  public setLoading(value = false): void {
    this.loading.next(value);
  }

  get viewBoardDataRefreshing() {
    return this.refreshBoardData$.asObservable();
  }

  boardDataRefreshing(status: boolean) {
    this.refreshBoardData$.next(status);
  }

  get viewFiltersData() {
    return this.filtersDataReady$.asObservable();
  }

  filtersDataReady(data: any) {
    this.filtersDataReady$.next(data);
  }
}
