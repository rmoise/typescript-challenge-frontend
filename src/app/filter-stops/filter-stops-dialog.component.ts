import { Component, ChangeDetectionStrategy } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { MatDialogRef } from '@angular/material/dialog'
import { RootState } from 'src/store/app.store'
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatDialogModule } from '@angular/material/dialog'
import { A11yModule } from '@angular/cdk/a11y'
import { fromTransitLines } from 'src/store/transit-lines/transit-lines.selectors'
import { take } from 'rxjs/operators'
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar'

@Component({
  selector: 'app-filter-stops-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    A11yModule,
    MatSnackBarModule
  ],
  template: `
    <div cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
      <h2 mat-dialog-title>Filter Stops</h2>
      <mat-dialog-content>
        <form [formGroup]="filterForm">
          <div class="filter-section">
            <h3>People Getting On</h3>
            <mat-button-toggle-group formControlName="peopleOn">
              <mat-button-toggle [value]="0">All</mat-button-toggle>
              <mat-button-toggle [value]="10">>10</mat-button-toggle>
              <mat-button-toggle [value]="50">>50</mat-button-toggle>
              <mat-button-toggle [value]="100">>100</mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          <div class="filter-section">
            <h3>People Getting Off</h3>
            <mat-button-toggle-group formControlName="peopleOff">
              <mat-button-toggle [value]="0">All</mat-button-toggle>
              <mat-button-toggle [value]="10">>10</mat-button-toggle>
              <mat-button-toggle [value]="50">>50</mat-button-toggle>
              <mat-button-toggle [value]="100">>100</mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          <div class="filter-section">
            <h3>Population Within Walking Distance</h3>
            <mat-button-toggle-group formControlName="reachablePopulationWalk">
              <mat-button-toggle [value]="0">All</mat-button-toggle>
              <mat-button-toggle [value]="1000">>1k</mat-button-toggle>
              <mat-button-toggle [value]="5000">>5k</mat-button-toggle>
              <mat-button-toggle [value]="10000">>10k</mat-button-toggle>
            </mat-button-toggle-group>
          </div>

          <div class="filter-section">
            <h3>Population Within Biking Distance</h3>
            <mat-button-toggle-group formControlName="reachablePopulationBike">
              <mat-button-toggle [value]="0">All</mat-button-toggle>
              <mat-button-toggle [value]="1000">>1k</mat-button-toggle>
              <mat-button-toggle [value]="5000">>5k</mat-button-toggle>
              <mat-button-toggle [value]="10000">>10k</mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="clearFilter()">Clear</button>
        <button mat-raised-button color="primary" (click)="onSubmit()">Apply</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .filter-section {
      margin-bottom: 24px;
    }
    h3 {
      margin-bottom: 8px;
      color: rgba(0, 0, 0, 0.87);
    }
    mat-button-toggle-group {
      width: 100%;
    }
    mat-button-toggle {
      flex: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterStopsDialogComponent {
  filterForm: FormGroup

  constructor(
    private fb: FormBuilder,
    private store: Store<RootState>,
    private dialogRef: MatDialogRef<FilterStopsDialogComponent>,
    private snackBar: MatSnackBar
  ) {
    this.store.select(fromTransitLines.currentFilter).pipe(take(1)).subscribe(filter => {
      this.filterForm = this.fb.group({
        peopleOn: [filter?.peopleOn || 0],
        peopleOff: [filter?.peopleOff || 0],
        reachablePopulationWalk: [filter?.reachablePopulationWalk || 0],
        reachablePopulationBike: [filter?.reachablePopulationBike || 0]
      });
    });
  }

  onSubmit() {
    const filter = Object.entries(this.filterForm.value)
      .reduce((acc, [key, value]) => {
        if (value !== 0) {
          acc[key] = value;
        }
        return acc;
      }, {});

    console.log('Submitting filter:', filter);
    this.store.dispatch(TransitLinesActions.FilterStops({ filter }));

    this.snackBar.open('Filter applied', 'Close', {
      duration: 3000,
    });

    this.dialogRef.close();
  }

  clearFilter() {
    const emptyFilter = {
      peopleOn: 0,
      peopleOff: 0,
      reachablePopulationWalk: 0,
      reachablePopulationBike: 0
    };

    this.filterForm.reset(emptyFilter);
    this.store.dispatch(TransitLinesActions.FilterStops({ filter: {} }));
    this.dialogRef.close();
  }
}
