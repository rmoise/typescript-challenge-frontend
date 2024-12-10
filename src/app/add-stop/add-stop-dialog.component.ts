import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatDialogRef } from '@angular/material/dialog';
import { RootState } from 'src/store/app.store';
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-add-stop-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>Add New Stop</h2>
    <mat-dialog-content>
      <form [formGroup]="stopForm">
        <mat-form-field>
          <input matInput placeholder="Name" formControlName="name">
        </mat-form-field>

        <mat-form-field>
          <input matInput type="number" placeholder="Latitude" formControlName="lat">
        </mat-form-field>

        <mat-form-field>
          <input matInput type="number" placeholder="Longitude" formControlName="lng">
        </mat-form-field>

        <mat-form-field>
          <input matInput type="number" placeholder="People Getting On" formControlName="peopleOn">
        </mat-form-field>

        <mat-form-field>
          <input matInput type="number" placeholder="People Getting Off" formControlName="peopleOff">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary"
              [disabled]="!stopForm.valid"
              (click)="onSubmit()">
        Add Stop
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 300px;
    }
    mat-dialog-content {
      padding-top: 20px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddStopDialogComponent {
  stopForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private store: Store<RootState>,
    private dialogRef: MatDialogRef<AddStopDialogComponent>
  ) {
    this.stopForm = this.fb.group({
      name: ['', Validators.required],
      lat: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      lng: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      peopleOn: [0, [Validators.required, Validators.min(0)]],
      peopleOff: [0, [Validators.required, Validators.min(0)]],
    });
  }

  onSubmit() {
    if (this.stopForm.valid) {
      const newStop = {
        ...this.stopForm.value,
        id: crypto.randomUUID(),
        prevId: '',
        nextId: '',
        reachablePopulationWalk: 0,
        reachablePopulationBike: 0,
      };

      this.store.dispatch(TransitLinesActions.AddStop({
        lineId: 'u9',
        stop: newStop
      }));

      this.dialogRef.close();
    }
  }
} 