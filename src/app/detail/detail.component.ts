import { ChangeDetectionStrategy, Component, computed, Signal, HostListener } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { NgIf, NgStyle, NgClass } from '@angular/common'
import { Store } from '@ngrx/store'
import { RootState } from 'src/store/app.store'
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions'
import { fromTransitLines } from 'src/store/transit-lines/transit-lines.selectors'
import { TransitStop } from 'src/types/line'
import { MatDialog } from '@angular/material/dialog'
import { EditStopDialogComponent } from '../edit-stop/edit-stop-dialog.component'
import { MatMenuModule } from '@angular/material/menu'
import { MatTooltipModule } from '@angular/material/tooltip'

/**
 * Component for displaying detailed information about a selected transit stop.
 * Provides functionality for viewing and editing stop details.
 */
@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    MatIcon,
    NgIf,
    NgStyle,
    NgClass,
    MatMenuModule,
    MatTooltipModule
  ],
})
export class DetailComponent {
  /** Signal for the currently selected stop */
  readonly selectedStop: Signal<TransitStop | null>

  /** Signal for the stop name */
  readonly stopName: Signal<string>

  /** Signal for maximum values of stop properties */
  readonly maxValues: Signal<{
    peopleOn: number
    peopleOff: number
    reachablePopulationWalk: number
    reachablePopulationBike: number
  }>

  /** Signal for the visualization property */
  readonly visualizationProperty = this.store.selectSignal(fromTransitLines.visualizationProperty)

  constructor(
    private store: Store<RootState>,
    private dialog: MatDialog
  ) {
    this.selectedStop = this.store.selectSignal(fromTransitLines.selectedStop)
    this.stopName = computed(() => {
      const stop = this.selectedStop()
      return stop ? stop.name : 'Please select a stop'
    })
    this.maxValues = this.store.selectSignal(fromTransitLines.maxStopValues)
  }

  /**
   * Handles mouse clicks outside the detail view
   * @param event The mouse event
   */
  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement
    const detailView = target.closest('app-detail')

    // Only close if clicking inside detail view's close button
    if (!detailView) {
      return
    }
  }

  /**
   * Handles the escape key press to close the detail view
   * @param event The keyboard event
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapePressed(event: KeyboardEvent) {
    this.clearSelection()
  }

  /**
   * Calculates the percentage of a value relative to its maximum
   * @param value The current value
   * @param max The maximum value
   * @returns The percentage value
   */
  getPercentage(value: number, max: number): number {
    return (value / max) * 100
  }

  /**
   * Gets the CSS class based on the percentage value
   * @param percentage The percentage value
   * @returns The CSS class name
   */
  getColorClass(percentage: number): string {
    if (percentage >= 66) return 'high-value'
    if (percentage >= 33) return 'medium-value'
    return 'low-value'
  }

  /**
   * Clears the current stop selection
   */
  clearSelection(): void {
    this.store.dispatch(TransitLinesActions.SelectStop({ selectedStopId: null }))
  }

  /**
   * Removes the current stop from its line
   */
  removeStop(): void {
    const stop = this.selectedStop()
    if (stop) {
      this.store.dispatch(
        TransitLinesActions.RemoveStop({
          lineId: 'u9',
          stopId: stop.id,
        })
      )
      this.store.dispatch(TransitLinesActions.SelectStop({ selectedStopId: null }))
    }
  }

  /**
   * Gets the current visualization value and label
   * @returns Object containing the label and value for visualization
   */
  getVisualizationValue(): { label: string; value: number } {
    const stop = this.selectedStop()
    if (!stop || this.visualizationProperty() === 'off') return { label: '', value: 0 }

    switch (this.visualizationProperty()) {
      case 'peopleOn':
        return { label: 'People getting on', value: stop.peopleOn }
      case 'peopleOff':
        return { label: 'People getting off', value: stop.peopleOff }
      case 'reachablePopulationWalk':
        return { label: 'Within 30min walk', value: stop.reachablePopulationWalk }
      case 'reachablePopulationBike':
        return { label: 'Within 30min bike', value: stop.reachablePopulationBike }
    }
  }

  /**
   * Gets the maximum value for the current visualization property
   * @returns The maximum value
   */
  getMaxValue(): number {
    const maxValues = this.maxValues()
    return maxValues[this.visualizationProperty()]
  }

  /**
   * Opens the edit dialog for the current stop
   */
  editStop(): void {
    const stop = this.selectedStop()
    if (stop) {
      this.dialog.open(EditStopDialogComponent, {
        width: '400px',
        data: { stop },
        disableClose: true,
      })
    }
  }
}
