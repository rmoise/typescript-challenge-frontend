import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { map, tap, filter } from 'rxjs/operators'
import { of } from 'rxjs'
import { TransitLinesActions } from './transit-lines.actions'

@Injectable()
export class TransitLinesEffects {
  navigateOnSelect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(TransitLinesActions.SelectStop),
        map((action) => (action.selectedStopId ? this.router.navigate(['detail']) : this.router.navigate(['home'])))
      ),
    { dispatch: false }
  )

  persistSelection$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(TransitLinesActions.SelectStop),
        tap((action) => {
          if (action.selectedStopId) {
            localStorage.setItem('selectedStopId', action.selectedStopId)
          } else {
            localStorage.removeItem('selectedStopId')
          }
        })
      ),
    { dispatch: false }
  )

  initializeSelection$ = createEffect(() =>
    of(localStorage.getItem('selectedStopId')).pipe(
      filter((id): id is string => id !== null),
      map((id) => TransitLinesActions.SelectStop({ selectedStopId: id }))
    )
  )

  constructor(
    private actions$: Actions,
    private router: Router
  ) {}
}
