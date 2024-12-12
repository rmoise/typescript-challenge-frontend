import { createAction, props } from '@ngrx/store'
import { TransitLine, TransitStop } from 'src/types/line'
import { StopFilter } from 'src/types/filter'

export namespace TransitLinesActions {
  export const AddLine = createAction(`[TRANSIT LINES] Add a line`, props<{ line: TransitLine }>())
  export const CreateNewLine = createAction(
    '[TRANSIT LINES] Create new line',
    props<{ id: string; stops: TransitStop[] }>()
  )
  export const CreateNewLineSuccess = createAction(
    '[TRANSIT LINES] Create new line success',
    props<{ line: TransitLine }>()
  )
  export const CreateNewLineFailure = createAction('[TRANSIT LINES] Create new line failure', props<{ error: any }>())
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
      lineId: string
      stopId: string
      updates: Partial<TransitStop>
    }>()
  )
  export const LoadFilteredStops = createAction('[TRANSIT LINES] Load Filtered Stops', props<{ filter: StopFilter }>())
  export const LoadFilteredStopsSuccess = createAction(
    '[TRANSIT LINES] Load Filtered Stops Success',
    props<{ stops: TransitStop[] }>()
  )
  export const LoadFilteredStopsFailure = createAction(
    '[TRANSIT LINES] Load Filtered Stops Failure',
    props<{ error: any }>()
  )
  export const FilterStops = createAction('[TRANSIT LINES] Filter Stops', props<{ filter: StopFilter }>())
  export const DeleteLine = createAction('[TRANSIT LINES] Delete line', props<{ id: string }>())
  export const DeleteLineSuccess = createAction('[TRANSIT LINES] Delete line success', props<{ id: string }>())
  export const DeleteLineFailure = createAction('[TRANSIT LINES] Delete line failure', props<{ error: any }>())
  export const SelectLine = createAction(
    '[TRANSIT LINES] Select a line',
    props<{ selectedLineId: string | null }>()
  )
}
