import { ChangeDetectionStrategy, Component, Signal } from '@angular/core'
import { MatIcon } from '@angular/material/icon'
import { MatButton } from '@angular/material/button'
import { Store } from '@ngrx/store'
import { JsonPipe, NgIf } from '@angular/common'
import { RootState } from 'src/store/app.store'
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions'
import { fromTransitLines } from 'src/store/transit-lines/transit-lines.selectors'
import { TransitLine } from 'src/types/line'
import { MatDialog } from '@angular/material/dialog'
import { AddStopDialogComponent } from '../add-stop/add-stop-dialog.component'
import { MatDialogModule } from '@angular/material/dialog'
import { AddLineDialogComponent } from '../add-line/add-line-dialog.component'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatIcon, MatButton, JsonPipe, NgIf, MatDialogModule],
})
export class HomeComponent {
  readonly lines: Signal<TransitLine[]>
  expandedLines = new Set<string>()

  constructor(
    private store: Store<RootState>,
    private dialog: MatDialog
  ) {
    this.lines = this.store.selectSignal(fromTransitLines.selectAll)
  }

  selectStop(selectedStopId: string): void {
    this.store.dispatch(TransitLinesActions.SelectStop({ selectedStopId }))
  }

  openAddStopDialog(): void {
    this.dialog.open(AddStopDialogComponent, {
      width: '400px',
      disableClose: true
    })
  }

  openAddLineDialog(): void {
    this.dialog.open(AddLineDialogComponent, {
      width: '400px',
      disableClose: true
    })
  }

  toggleLineExpansion(lineId: string): void {
    if (this.expandedLines.has(lineId)) {
      this.expandedLines.delete(lineId)
    } else {
      this.expandedLines.add(lineId)
    }
  }

  isLineExpanded(lineId: string): boolean {
    return this.expandedLines.has(lineId)
  }
}
