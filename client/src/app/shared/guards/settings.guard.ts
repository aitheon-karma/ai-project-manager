import { Injectable } from '@angular/core';
import {
    CanActivate, CanActivateChild
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { GeneralService } from '../services/general/general.service';

@Injectable({
    providedIn: 'root',
})
export class SettingsGuard implements CanActivate, CanActivateChild {
    constructor(private generalService: GeneralService) { }

    canActivate()  {
      return this.generalService.currentPermission$();
    }

    canActivateChild() {
      return this.generalService.currentPermission$();
    }
}
