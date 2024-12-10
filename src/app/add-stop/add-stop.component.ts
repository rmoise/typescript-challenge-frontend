import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RootState } from 'src/store/app.store';
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-add-stop',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, NgIf],
  template: `
    <form [formGroup]="stopForm" (ngSubmit)="onSubmit()">
      <h2>Add New Stop</h2>

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

      <button mat-raised-button color="primary" type="submit" [disabled]="!stopForm.valid">
        Add Stop
      </button>
    </form>
  `,
  styles: [`
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      max-width: 400px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddStopComponent {
  stopForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private store: Store<RootState>
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
        prevId: '', // Will need to be set based on where in the line it's being added
        nextId: '', // Will need to be set based on where in the line it's being added
        reachablePopulationWalk: 0, // These would normally be calculated
        reachablePopulationBike: 0, // These would normally be calculated
      };

      this.store.dispatch(TransitLinesActions.AddStop({
        lineId: 'u9', // Hardcoded for now since we only have one line
        stop: newStop
      }));

      this.stopForm.reset();
    }
  }
} 