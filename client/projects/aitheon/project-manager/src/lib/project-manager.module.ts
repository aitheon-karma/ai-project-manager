import { NgModule, Optional, ModuleWithProviders, SkipSelf } from '@angular/core';
import { ApiModule } from './rest/api.module';
import { Configuration } from './rest/configuration';

@NgModule({
  declarations: [
  ],
  imports: [
    ApiModule
  ],
  providers: [
  ],
  exports: [
    ApiModule
  ]
})
export class ProjectManagerModule {
  public static forRoot(configurationFactory: () => Configuration): ModuleWithProviders {
    return {
      ngModule: ProjectManagerModule,
      providers: [
        { provide: Configuration, useFactory: configurationFactory }
      ]
    };
  }
  constructor(@Optional() @SkipSelf() parentModule: ProjectManagerModule) {
    if (parentModule) {
      throw new Error('ProjectManagerModule is already loaded. Import in your base AppModule only.');
    }
  }
}
// dist
