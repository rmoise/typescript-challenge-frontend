import { Component, Inject } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { NgFor } from '@angular/common'
import { TransitLine } from 'src/types/line'

@Component({
  selector: 'app-select-line-dialog',
  template: `
    <h2 mat-dialog-title>Select Line</h2>
    <mat-dialog-content>
      <div class="line-list">
        @for (line of data.lines; track line.id) {
          <button mat-button class="line-button" (click)="selectLine(line.id)">
            <mat-icon>directions_transit</mat-icon>
            <span>Line {{ line.id.toUpperCase() }}</span>
          </button>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .line-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 250px;
      padding: 8px 0;
    }
    .line-button {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      justify-content: flex-start;
    }
  `],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, NgFor]
})
export class SelectLineDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SelectLineDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { lines: TransitLine[] }
  ) {}

  selectLine(lineId: string) {
    this.dialogRef.close(lineId)
  }
}