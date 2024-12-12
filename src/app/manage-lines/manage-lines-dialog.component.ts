import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { RootState } from 'src/store/app.store';
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions';
import { fromTransitLines } from 'src/store/transit-lines/transit-lines.selectors';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { NgFor, AsyncPipe } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

/**
 * Dialog component for managing transit lines.
 * Provides functionality to view and delete transit lines.
 */
@Component({
  selector: 'app-manage-lines-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatListModule,
    MatIconModule,
    NgFor,
    AsyncPipe,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Manage Transit Lines</h2>
    <mat-dialog-content>
      <mat-list>
        <mat-list-item *ngFor="let line of lines$ | async">
          <span>{{ line.id }}</span>
          <button mat-icon-button color="warn" (click)="deleteLine(line.id)">
            <mat-icon>delete</mat-icon>
          </button>
        </mat-list-item>
      </mat-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageLinesDialogComponent {
  /** Observable of all transit lines */
  lines$ = this.store.select(fromTransitLines.selectAll);

  constructor(
    private store: Store<RootState>,
    public dialogRef: MatDialogRef<ManageLinesDialogComponent>,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Deletes a transit line after confirmation
   * @param id The ID of the line to delete
   */
  deleteLine(id: string) {
    if (confirm(`Are you sure you want to delete line ${id}?`)) {
      this.store.dispatch(TransitLinesActions.DeleteLine({ id }));
      this.snackBar.open(`Line ${id} deleted`, 'Close', {
        duration: 3000,
      });
    }
  }
}