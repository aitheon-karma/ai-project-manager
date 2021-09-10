import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router'
@Injectable()
export class RouterStateService {
    params$: Observable<Params>;
}


