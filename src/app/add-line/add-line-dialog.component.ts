import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RootState } from 'src/store/app.store';
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogRef } from '@angular/material/dialog';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-add-line-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, NgIf],
  template: `
    <form [formGroup]="lineForm" (ngSubmit)="onSubmit()">
      <h2>Add New Transit Line</h2>

      <mat-form-field>
        <input matInput placeholder="Line ID (e.g. u8)" formControlName="id">
      </mat-form-field>

      <div class="actions">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!lineForm.valid">
          Create Line
        </button>
      </div>
    </form>
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddLineDialogComponent {
  lineForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private store: Store<RootState>,
    public dialogRef: MatDialogRef<AddLineDialogComponent>
  ) {
    this.lineForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern('^[a-z][0-9]$')]],
    });
  }

  onSubmit() {
    if (this.lineForm.valid) {
      const { id } = this.lineForm.value;
      this.store.dispatch(TransitLinesActions.CreateNewLine({ id }));
      this.dialogRef.close();
    }
  }
} 