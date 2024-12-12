import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { RootState } from 'src/store/app.store'
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions'
import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { NgIf } from '@angular/common'

interface DialogData {
  lineId: string
  isInitialStop?: boolean
  requiredStops?: number
}

@Component({
  selector: 'app-add-stop-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    NgIf
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>{{ data.isInitialStop ? 'Add Initial Stop' : 'Add Stop' }}</h2>

      <mat-dialog-content>
        <form [formGroup]="stopForm" (ngSubmit)="onSubmit()">
          <mat-form-field>
            <input matInput placeholder="Name" formControlName="name">
            <mat-error *ngIf="stopForm.get('name')?.errors?.['required']">
              Name is required
            </mat-error>
          </mat-form-field>

          <div class="coordinate-field">
            <div class="coordinate-header">
              <label>Latitude</label>
              <mat-form-field>
                <input matInput
                       type="number"
                       [formControlName]="'lat'"
                       [min]="52.4"
                       [max]="52.6"
                       step="0.000001"
                       (input)="onInputChange('lat', $event)">
              </mat-form-field>
            </div>
            <mat-error *ngIf="stopForm.get('lat')?.errors?.['required']">
              Latitude is required
            </mat-error>
          </div>

          <div class="coordinate-field">
            <div class="coordinate-header">
              <label>Longitude</label>
              <mat-form-field>
                <input matInput
                       type="number"
                       [formControlName]="'lng'"
                       [min]="13.3"
                       [max]="13.5"
                       step="0.000001"
                       (input)="onInputChange('lng', $event)">
              </mat-form-field>
            </div>
            <mat-error *ngIf="stopForm.get('lng')?.errors?.['required']">
              Longitude is required
            </mat-error>
          </div>

          <div class="info-text" *ngIf="data.isInitialStop">
            <p>Stop {{ currentStopNumber }} of {{ data.requiredStops }}</p>
            <p>At least {{ data.requiredStops }} stops are required to create a line.</p>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button
          mat-raised-button
          color="primary"
          (click)="onSubmit()"
          [disabled]="!stopForm.valid"
        >
          {{ data.isInitialStop ? 'Add Stop' : 'Create Stop' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 24px;
      padding-bottom: 0;
    }

    mat-dialog-content {
      padding-top: 20px;
      padding-bottom: 20px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .coordinate-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .coordinate-header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        label {
          color: rgba(0, 0, 0, 0.6);
          font-size: 0.875rem;
        }

        mat-form-field {
          width: 100%;
        }
      }

      mat-error {
        font-size: 0.75rem;
        color: #f44336;
        margin-top: 0.25rem;
      }
    }

    mat-form-field {
      width: 100%;
    }

    .info-text {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.875rem;
      margin: 0;
    }

    mat-dialog-actions {
      padding: 16px 0;
      margin-bottom: 0;
    }
  `]
})
export class AddStopDialogComponent implements OnInit {
  stopForm: FormGroup
  currentStopNumber = 1

  constructor(
    private fb: FormBuilder,
    private store: Store<RootState>,
    public dialogRef: MatDialogRef<AddStopDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.stopForm = this.fb.group({
      name: ['', Validators.required],
      lat: [52.557107, Validators.required],
      lng: [13.373279, Validators.required],
    })
  }

  ngOnInit() {
    if (this.data.isInitialStop) {
      this.currentStopNumber = 1
    }
  }

  onInputChange(field: 'lat' | 'lng', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      const roundedValue = Number(numValue.toFixed(6));
      this.stopForm.get(field)?.setValue(roundedValue, { emitEvent: false });
    }
  }

  onSubmit() {
    if (this.stopForm.valid) {
      const formValues = this.stopForm.value;
      const stop = {
        ...formValues,
        lat: Number(Number(formValues.lat).toFixed(6)),
        lng: Number(Number(formValues.lng).toFixed(6)),
        id: `${this.data.lineId}-stop-${Date.now()}`,
        prevId: null,
        nextId: null,
        peopleOn: 0,
        peopleOff: 0,
        reachablePopulationWalk: 0,
        reachablePopulationBike: 0
      }

      if (this.data.isInitialStop) {
        this.dialogRef.close(stop)
      } else {
        this.store.dispatch(TransitLinesActions.AddStop({
          lineId: this.data.lineId,
          stop
        }))
        this.dialogRef.close()
      }
    }
  }
}
