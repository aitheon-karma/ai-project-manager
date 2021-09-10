import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

import { CoreClientModule } from '@aitheon/core-client';
import { ProjectManagerModule } from '@aitheon/project-manager';
import { ItemManagerModule } from '@aitheon/item-manager';
import { DriveModule } from '@aitheon/drive';
import { MarketplaceModule } from '@aitheon/marketplace';
import { CreatorsStudioModule } from '@aitheon/creators-studio';
import { SystemGraphModule } from '@aitheon/system-graph';
import { OrchestratorModule, Configuration, ConfigurationParameters } from '@aitheon/orchestrator';
import { ColorPickerModule } from 'ngx-color-picker';
import { AvatarModule } from 'ngx-avatar';

export function apiConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: '.'
  };
  return new Configuration(params);
}

export function apiOrchestratorConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: `${environment.production ? '' : environment.baseApi}/orchestrator`
  };
  return new Configuration(params);
}
export function apiItemManagerConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: `${environment.production ? '' : environment.baseApi}/item-manager`
  };
  return new Configuration(params);
}

export function apiDriveConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: `${environment.production ? '' : environment.baseApi}/drive`
  };
  return new Configuration(params);
}

export function apiMarketplaceConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: `${environment.production ? '' : environment.baseApi}/marketplace`
  };
  return new Configuration(params);
}

export function apiCreatorsStudioConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: `${environment.production ? '' : environment.baseApi}/creators-studio`
  };
  return new Configuration(params);
}

export function apiSystemGraphConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: `${environment.production ? '' : environment.baseApi}/system-graph`
  };
  return new Configuration(params);
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CoreClientModule.forRoot({
      baseApi: environment.baseApi,
      production: environment.production,
      service: environment.service
    }),
    OrchestratorModule.forRoot(apiOrchestratorConfigFactory),
    AppRoutingModule,
    ProjectManagerModule.forRoot(apiConfigFactory),
    ItemManagerModule.forRoot(apiItemManagerConfigFactory),
    DriveModule.forRoot(apiDriveConfigFactory),
    MarketplaceModule.forRoot(apiMarketplaceConfigFactory),
    CreatorsStudioModule.forRoot(apiCreatorsStudioConfigFactory),
    SystemGraphModule.forRoot(apiSystemGraphConfigFactory),
    ColorPickerModule,
    AvatarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})

export class AppModule { }
