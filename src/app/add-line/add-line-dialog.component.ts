import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RootState } from 'src/store/app.store';
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgIf } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { AddStopDialogComponent } from '../add-stop/add-stop-dialog.component';
import { firstValueFrom } from 'rxjs';
import { TransitStop } from 'src/types/line';

@Component({
  selector: 'app-add-line-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, NgIf, A11yModule],
  template: `
    <div cdkTrapFocus cdkTrapFocusAutoCapture>
      <form [formGroup]="lineForm" (ngSubmit)="onSubmit()">
        <h2 mat-dialog-title>Add New Transit Line</h2>

        <mat-form-field>
          <input
            matInput
            placeholder="Line ID (e.g. u8)"
            formControlName="id"
            [attr.aria-label]="'Line ID'"
          >
          <mat-error *ngIf="lineForm.get('id')?.errors?.['required']">
            Line ID is required
          </mat-error>
          <mat-error *ngIf="lineForm.get('id')?.errors?.['pattern']">
            Line ID must start with a letter followed by numbers
          </mat-error>
        </mat-form-field>

        <p class="info-text">
          You'll need to add at least 2 stops after creating the line.
        </p>

        <div class="actions">
          <button
            mat-button
            type="button"
            (click)="dialogRef.close()"
            [attr.aria-label]="'Cancel'"
          >
            Cancel
          </button>
          <button
            mat-raised-button
            color="primary"
            type="submit"
            [disabled]="!lineForm.valid || isSubmitting"
            [attr.aria-label]="'Create Line'"
          >
            {{ isSubmitting ? 'Creating...' : 'Create Line' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      min-width: 300px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .info-text {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.875rem;
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddLineDialogComponent {
  lineForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private store: Store<RootState>,
    public dialogRef: MatDialogRef<AddLineDialogComponent>,
    private dialog: MatDialog
  ) {
    this.lineForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern('^[a-zA-Z][a-zA-Z0-9]*$')]],
    });
  }

  async onSubmit() {
    if (this.lineForm.valid && !this.isSubmitting) {
      const { id } = this.lineForm.value;
      const lineId = id.toLowerCase();
      this.isSubmitting = true;

      try {
        // Collect 2 stops
        const stops: TransitStop[] = [];

        for (let i = 0; i < 2; i++) {
          const dialogRef = this.dialog.open(AddStopDialogComponent, {
            width: '400px',
            data: {
              lineId,
              isInitialStop: true,
              requiredStops: 2,
              currentStop: i + 1
            },
            disableClose: true // Prevent clicking outside to close
          });

          const stop = await firstValueFrom(dialogRef.afterClosed());

          if (!stop) {
            // User cancelled
            this.isSubmitting = false;
            return;
          }

          stops.push(stop);
        }

        // Update prevId and nextId for the stops
        stops[0].nextId = stops[1].id;
        stops[1].prevId = stops[0].id;

        // Create the line with initial stops
        this.store.dispatch(TransitLinesActions.CreateNewLine({
          id: lineId,
          stops
        }));
        this.dialogRef.close();
      } catch (error) {
        this.isSubmitting = false;
        console.error('Error creating line:', error);
      }
    }
  }
}