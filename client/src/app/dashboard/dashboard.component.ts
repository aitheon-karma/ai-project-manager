import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardType } from '../shared/constants/enums';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { Cookie } from '@aitheon/core-client';
import {
  AuthService,
  ModalService,
} from '@aitheon/core-client';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ai-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeTab: DashboardType = DashboardType.DASHBOARD;
  dashboardType = DashboardType;
  search: boolean = false;
  showAutomate: boolean = false;
  private subscriptions$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    public modalService: ModalService,
  ) {}

  ngOnInit() {
    const baseHost = Cookie.get('base_host');
    // this.showAutomate = baseHost !== 'beta.aitheon.com' && baseHost !== 'aitheon.com';

    this.onTabChange();
  }

  onTabChange(): void {
    this.subscriptions$.add(this.activatedRoute.queryParams.subscribe((param: Params) => {
      if (param.tab) {
        const tab: DashboardType = DashboardType[(param.tab).toUpperCase()];
        if (tab) {
          this.activeTab = tab;
        } else {
          this.changeActiveTab();
        }
      } else {
        this.changeActiveTab();
      }
    }));
  }

  changeActiveTab(type: DashboardType = '' as any) {
    this.activeTab = type || DashboardType.DASHBOARD;
    if (type) {
      this.router.navigate(
        [],
        {
          relativeTo: this.activatedRoute,
          queryParams: { tab: type === DashboardType.DASHBOARD ? 'dashboard-application' : type.toLowerCase() },
        });
    }

  }

  onCloseSearch() {
    this.search = false;
  }

  openSearch() {
    this.search = true;
  }

  ngOnDestroy() {
    try {
      this.subscriptions$.unsubscribe();
    } catch (e) {
    }
  }
}
