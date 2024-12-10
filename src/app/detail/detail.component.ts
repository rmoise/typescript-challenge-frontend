import { ChangeDetectionStrategy, Component, computed, Signal } from '@angular/core'
import { MatIconButton } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { NgIf, NgStyle, NgClass } from '@angular/common'
import { Store } from '@ngrx/store'
import { RootState } from 'src/store/app.store'
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions'
import { fromTransitLines } from 'src/store/transit-lines/transit-lines.selectors'
import { TransitStop } from 'src/types/line'

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatIconButton, MatIcon, NgIf, NgStyle, NgClass],
})
export class DetailComponent {
  readonly selectedStop: Signal<TransitStop | null>
  readonly stopName: Signal<string>
  readonly maxValues: Signal<{
    peopleOn: number;
    peopleOff: number;
    reachablePopulationWalk: number;
    reachablePopulationBike: number;
  }>
  readonly visualizationProperty = this.store.selectSignal(fromTransitLines.visualizationProperty);

  constructor(private store: Store<RootState>) {
    this.selectedStop = this.store.selectSignal(fromTransitLines.selectedStop)
    this.stopName = computed(() => {
      const stop = this.selectedStop()
      return stop ? stop.name : 'Please select a stop'
    })
    this.maxValues = this.store.selectSignal(fromTransitLines.maxStopValues)
  }

  getPercentage(value: number, max: number): number {
    return (value / max) * 100
  }

  getColorClass(percentage: number): string {
    if (percentage >= 80) return 'high-value'
    if (percentage >= 40) return 'medium-value'
    return 'low-value'
  }

  clearSelection(): void {
    this.store.dispatch(TransitLinesActions.SelectStop({ selectedStopId: null }))
  }

  removeStop(): void {
    const stop = this.selectedStop();
    if (stop) {
      this.store.dispatch(TransitLinesActions.RemoveStop({
        lineId: 'u9', // Hardcoded for now since we only have one line
        stopId: stop.id
      }));
      this.store.dispatch(TransitLinesActions.SelectStop({ selectedStopId: null }));
    }
  }

  getVisualizationValue(): { label: string, value: number } {
    const stop = this.selectedStop();
    if (!stop || this.visualizationProperty() === 'off') return { label: '', value: 0 };

    switch (this.visualizationProperty()) {
      case 'peopleOn':
        return { label: 'People getting on', value: stop.peopleOn };
      case 'peopleOff':
        return { label: 'People getting off', value: stop.peopleOff };
      case 'reachablePopulationWalk':
        return { label: 'Within 30min walk', value: stop.reachablePopulationWalk };
      case 'reachablePopulationBike':
        return { label: 'Within 30min bike', value: stop.reachablePopulationBike };
    }
  }

  getMaxValue(): number {
    const maxValues = this.maxValues();
    return maxValues[this.visualizationProperty()];
  }
}
