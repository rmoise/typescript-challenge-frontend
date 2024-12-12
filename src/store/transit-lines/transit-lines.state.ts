import { EntityState } from '@ngrx/entity';
import { TransitLine } from '../../types/line';
import { StopFilter } from '../../types/stop-filter';

export type VisualizationProperty = 'off' | 'peopleOn' | 'peopleOff' | 'reachablePopulationWalk' | 'reachablePopulationBike';

export interface TransitLinesState extends EntityState<TransitLine> {
  selectedStopId: string | null;
  visualizationProperty: VisualizationProperty;
  currentFilter: StopFilter;
}