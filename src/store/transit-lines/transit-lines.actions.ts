import { createAction, props } from '@ngrx/store'
import { TransitLine, TransitStop } from 'src/types/line'

export namespace TransitLinesActions {
  export const AddLine = createAction(`[TRANSIT LINES] Add a line`, props<{ line: TransitLine }>())
  export const CreateNewLine = createAction(
    '[TRANSIT LINES] Create new line',
    props<{ id: string }>()
  )
  export const SelectStop = createAction(`[TRANSIT LINES] Select a stop`, props<{ selectedStopId: string }>())
  export const AddStop = createAction(`[TRANSIT LINES] Add a stop`, props<{ lineId: string; stop: TransitStop }>())
  export const RemoveStop = createAction(`[TRANSIT LINES] Remove a stop`, props<{ lineId: string; stopId: string }>())
  export const SetVisualizationProperty = createAction(
    '[TRANSIT LINES] Set visualization property',
    props<{ property: 'off' | 'peopleOn' | 'peopleOff' | 'reachablePopulationWalk' | 'reachablePopulationBike' }>()
  )
  export const EditStop = createAction(
    '[TRANSIT LINES] Edit a stop',
    props<{
      lineId: string;
      stopId: string;
      updates: Partial<TransitStop>;
    }>()
  )
}
