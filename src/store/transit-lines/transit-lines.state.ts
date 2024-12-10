import { EntityState } from '@ngrx/entity';
import { TransitLine } from 'src/types/line';

export type VisualizationProperty = 'off' | 'peopleOn' | 'peopleOff' | 'reachablePopulationWalk' | 'reachablePopulationBike';

export interface TransitLinesState extends EntityState<TransitLine> {
  selectedStopId: string | null;
  visualizationProperty: VisualizationProperty;
} 