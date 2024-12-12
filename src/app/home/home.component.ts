import { ChangeDetectionStrategy, Component, Signal } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatMenuModule } from '@angular/material/menu'
import { Store } from '@ngrx/store'
import { JsonPipe, NgIf } from '@angular/common'
import { RootState } from 'src/store/app.store'
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions'
import { fromTransitLines } from 'src/store/transit-lines/transit-lines.selectors'
import { TransitLine } from 'src/types/line'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { AddStopDialogComponent } from '../add-stop/add-stop-dialog.component'
import { FilterStopsDialogComponent } from '../filter-stops/filter-stops-dialog.component'
import { AddLineDialogComponent } from '../add-line/add-line-dialog.component'
import { LiveAnnouncer } from '@angular/cdk/a11y'
import { ManageLinesDialogComponent } from '../manage-lines/manage-lines-dialog.component'
import { DeleteLineDialogComponent } from '../delete-line/delete-line-dialog.component'
import { SelectLineDialogComponent } from '../select-line/select-line-dialog.component'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    JsonPipe,
    NgIf,
    MatDialogModule
  ],
})
export class HomeComponent {
  readonly lines: Signal<TransitLine[]>
  expandedLines = new Set<string>()

  fabButtons = [
    {
      icon: 'directions_transit',
      tooltip: 'Add Line',
      action: () => this.openAddLineDialog()
    },
    {
      icon: 'stop_circle',
      tooltip: 'Add Stop',
      action: () => this.openAddStopDialog()
    },
    {
      icon: 'filter_list',
      tooltip: 'Filter Stops',
      action: () => this.openFilterDialog()
    },
    {
      icon: 'delete',
      tooltip: 'Delete Line',
      action: () => this.openDeleteLineMenu()
    }
  ];

  constructor(
    private store: Store<RootState>,
    private dialog: MatDialog,
    private liveAnnouncer: LiveAnnouncer
  ) {
    this.lines = this.store.selectSignal(fromTransitLines.selectAll)
  }

  selectStop(selectedStopId: string): void {
    this.store.dispatch(TransitLinesActions.SelectStop({ selectedStopId }))
  }

  openAddStopDialog(): void {
    const lines = this.lines();
    if (lines.length === 0) {
      alert('Please create a line first before adding stops.');
      return;
    }

    // If there's only one line, use it directly
    if (lines.length === 1) {
      this.openAddStopDialogWithLine(lines[0].id);
      return;
    }

    // If there are multiple lines, open a selection dialog first
    const dialogRef = this.dialog.open(SelectLineDialogComponent, {
      width: '300px',
      data: {
        lines: lines
      }
    });

    dialogRef.afterClosed().subscribe(lineId => {
      if (lineId) {
        this.openAddStopDialogWithLine(lineId);
      }
    });
  }

  private openAddStopDialogWithLine(lineId: string): void {
    document.querySelector('app-root')?.setAttribute('inert', '');

    const dialogRef = this.dialog.open(AddStopDialogComponent, {
      width: '400px',
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      autoFocus: true,
      restoreFocus: true,
      disableClose: false,
      panelClass: ['dialog-container', 'a11y-dialog'],
      ariaDescribedBy: null,
      ariaLabelledBy: 'dialog-title',
      data: {
        lineId: lineId,
        isInitialStop: false
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      document.querySelector('app-root')?.removeAttribute('inert');
      this.liveAnnouncer.announce('Dialog closed', 'polite');
    });
  }

  openAddLineDialog(): void {
    document.querySelector('app-root')?.setAttribute('inert', '');

    const dialogRef = this.dialog.open(AddLineDialogComponent, {
      width: '400px',
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      autoFocus: true,
      restoreFocus: true,
      disableClose: false,
      panelClass: ['dialog-container', 'a11y-dialog'],
      ariaDescribedBy: null,
      ariaLabelledBy: 'dialog-title'
    });

    dialogRef.afterClosed().subscribe(() => {
      document.querySelector('app-root')?.removeAttribute('inert');
      this.liveAnnouncer.announce('Dialog closed', 'polite');
    });
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

  openFilterDialog(): void {
    document.querySelector('app-root')?.setAttribute('inert', '');

    const dialogRef = this.dialog.open(FilterStopsDialogComponent, {
      width: '400px',
      hasBackdrop: true,
      backdropClass: ['dialog-backdrop', 'cdk-overlay-dark-backdrop'],
      autoFocus: true,
      restoreFocus: true,
      disableClose: false,
      panelClass: 'dialog-container',
      ariaDescribedBy: null,
      ariaLabelledBy: 'filter-dialog-title'
    });

    dialogRef.afterClosed().subscribe(() => {
      document.querySelector('app-root')?.removeAttribute('inert');
      this.liveAnnouncer.announce('Dialog closed', 'polite');
    });
  }

  openManageLines(): void {
    document.querySelector('app-root')?.setAttribute('inert', '');

    const dialogRef = this.dialog.open(ManageLinesDialogComponent, {
      width: '400px',
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      autoFocus: true,
      restoreFocus: true,
      disableClose: false,
      panelClass: ['dialog-container', 'a11y-dialog'],
      ariaDescribedBy: null,
      ariaLabelledBy: 'dialog-title'
    });

    dialogRef.afterClosed().subscribe(() => {
      document.querySelector('app-root')?.removeAttribute('inert');
      this.liveAnnouncer.announce('Dialog closed', 'polite');
    });
  }

  openDeleteLineMenu(): void {
    document.querySelector('app-root')?.setAttribute('inert', '');

    const dialogRef = this.dialog.open(DeleteLineDialogComponent, {
      width: '300px',
      hasBackdrop: true,
      backdropClass: 'dialog-backdrop',
      autoFocus: true,
      restoreFocus: true,
      disableClose: false,
      panelClass: ['dialog-container', 'a11y-dialog'],
      ariaDescribedBy: null,
      ariaLabelledBy: 'dialog-title',
      data: {
        lines: this.lines()
      }
    });

    dialogRef.afterClosed().subscribe(lineId => {
      document.querySelector('app-root')?.removeAttribute('inert');
      this.liveAnnouncer.announce('Dialog closed', 'polite');

      if (lineId) {
        if (confirm(`Are you sure you want to delete line ${lineId.toUpperCase()}?`)) {
          console.log('Deleting line:', lineId);
          this.store.dispatch(TransitLinesActions.DeleteLine({ id: lineId }));
        }
      }
    });
  }
}
