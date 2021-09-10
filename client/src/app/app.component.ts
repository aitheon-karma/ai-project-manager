import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '@aitheon/core-client';
import { SharedService } from './shared/services/shared.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'ai-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  loading: boolean;
  loginSubscription: Subscription;
  loadingSubscription: Subscription;

  constructor(
    private authService: AuthService,
    private sharedService: SharedService,
  ) {}

  ngOnInit() {
    this.loginSubscription = this.authService.loggedIn.subscribe(loggedIn => {
      if (!loggedIn && !this.isLocalhost) {
        window.location.href = '/login';
      }
    });
    this.loadingSubscription = this.sharedService.loading.subscribe(loading => {
      this.loading = loading;
    });
  }

  private get isLocalhost() {
    return window.location.hostname === 'localhost';
  }

  ngOnDestroy(): void {
    this.loadingSubscription.unsubscribe();
    this.loginSubscription.unsubscribe();
  }
}
