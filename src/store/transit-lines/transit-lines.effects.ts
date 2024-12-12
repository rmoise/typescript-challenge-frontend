import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { map, tap, filter, switchMap, catchError } from 'rxjs/operators'
import { of } from 'rxjs'
import { TransitLinesActions } from './transit-lines.actions'
import { ApiService } from '../../services/api.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { TransitLine } from 'src/types/line'

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

  loadFilteredStops$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransitLinesActions.LoadFilteredStops),
      switchMap(({ filter }) =>
        this.apiService.getFilteredStops(filter).pipe(
          map(stops => TransitLinesActions.LoadFilteredStopsSuccess({ stops })),
          catchError(error => of(TransitLinesActions.LoadFilteredStopsFailure({ error })))
        )
      )
    )
  )

  filterStops$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransitLinesActions.FilterStops),
      tap(action => console.log('Filtering stops with:', action.filter)),
      switchMap(({ filter }) =>
        this.apiService.getFilteredStops(filter).pipe(
          tap(stops => console.log('Filtered stops received:', stops)),
          map(stops => TransitLinesActions.LoadFilteredStopsSuccess({ stops })),
          catchError(error => {
            console.error('Filter error:', error);
            return of(TransitLinesActions.LoadFilteredStopsFailure({ error }));
          })
        )
      )
    )
  );

  createLine$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransitLinesActions.CreateNewLine),
      switchMap(({ id, stops }) =>
        this.apiService.createTransitLine(id, stops).pipe(
          map(() => {
            const line: TransitLine = {
              id,
              stops
            };
            this.snackBar.open(`Line ${id} created successfully with ${stops.length} stops`, 'Close', {
              duration: 3000,
            });
            return TransitLinesActions.CreateNewLineSuccess({ line });
          }),
          catchError(error => {
            const message = error.status === 400 ?
              error.error?.error || 'Line ID already exists' :
              'Error creating line';
            this.snackBar.open(message, 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            return of(TransitLinesActions.CreateNewLineFailure({ error }));
          })
        )
      )
    )
  );

  deleteLine$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransitLinesActions.DeleteLine),
      switchMap(({ id }) =>
        this.apiService.deleteTransitLine(id).pipe(
          map(() => TransitLinesActions.DeleteLineSuccess({ id })),
          catchError(error => of(TransitLinesActions.DeleteLineFailure({ error })))
        )
      )
    )
  );

  persistLineSelection$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(TransitLinesActions.SelectLine),
        tap((action) => {
          if (action.selectedLineId) {
            localStorage.setItem('selectedLineId', action.selectedLineId)
          } else {
            localStorage.removeItem('selectedLineId')
          }
        })
      ),
    { dispatch: false }
  )

  initializeLineSelection$ = createEffect(() =>
    of(localStorage.getItem('selectedLineId')).pipe(
      filter((id): id is string => id !== null),
      map((id) => TransitLinesActions.SelectLine({ selectedLineId: id }))
    )
  )

  constructor(
    private actions$: Actions,
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}
}
