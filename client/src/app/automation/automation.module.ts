import { CoreClientModule } from '@aitheon/core-client';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutomationRoutingModule } from './automation-routing.module';
import { AutomationDashboardComponent } from './automation-dashboard/automation-dashboard.component';

@NgModule({
  imports: [
    CommonModule,
    CoreClientModule,
    AutomationRoutingModule,
  ],
  declarations: [
    AutomationDashboardComponent
  ],
})
export class AutomationModule { }
