import { createEntityAdapter, EntityState } from '@ngrx/entity'
import { createReducer, on } from '@ngrx/store'
import { TransitLine, TransitStop } from 'src/types/line'
import { TransitLinesActions } from './transit-lines.actions'

export const TRANSIT_LINES_KEY = 'transit-lines'

export interface TransitLinesState extends EntityState<TransitLine> {
  selectedStopId: string | null
  selectedLineId: string | null
  visualizationProperty: 'off' | 'peopleOn' | 'peopleOff' | 'reachablePopulationWalk' | 'reachablePopulationBike'
  filteredStops: TransitStop[]
  filterLoading: boolean
  filterError: any
  currentFilter: any
}

export const adapter = createEntityAdapter<TransitLine>()

export const initialState: TransitLinesState = adapter.getInitialState({
  selectedStopId: null,
  selectedLineId: null,
  visualizationProperty: 'off',
  filteredStops: [],
  filterLoading: false,
  filterError: null,
  currentFilter: {}
})

export const transitLinesReducer = createReducer(
  initialState,

  on(TransitLinesActions.AddLine, (state, { line }) => adapter.addOne(line, state)),

  on(TransitLinesActions.SelectStop, (state, { selectedStopId }) => ({
    ...state,
    selectedStopId,
  })),

  on(TransitLinesActions.AddStop, (state, { lineId, stop }) => {
    const line = state.entities[lineId]
    if (!line) return state

    const updatedLine = {
      ...line,
      stops: [...line.stops, stop],
    }

    return adapter.updateOne(
      {
        id: lineId,
        changes: updatedLine,
      },
      state
    )
  }),

  on(TransitLinesActions.RemoveStop, (state, { lineId, stopId }) => {
    const line = state.entities[lineId]
    if (!line) return state

    // Find the stop to remove
    const stopToRemove = line.stops.find((stop) => stop.id === stopId)
    if (!stopToRemove) return state

    // Update connections for adjacent stops
    const updatedStops = line.stops
      .filter((stop) => stop.id !== stopId)
      .map((stop) => ({
        ...stop,
        prevId: stop.prevId === stopId ? stopToRemove.prevId : stop.prevId,
        nextId: stop.nextId === stopId ? stopToRemove.nextId : stop.nextId,
      }))

    const updatedLine = {
      ...line,
      stops: updatedStops,
    }

    return adapter.updateOne(
      {
        id: lineId,
        changes: updatedLine,
      },
      state
    )
  }),

  on(TransitLinesActions.SetVisualizationProperty, (state, { property }) => ({
    ...state,
    visualizationProperty: property,
  })),

  on(TransitLinesActions.EditStop, (state, { lineId, stopId, updates }) => {
    const line = state.entities[lineId];
    if (!line) return state;

    const updatedStops = line.stops.map(stop =>
      stop.id === stopId ? { ...stop, ...updates } : stop
    );

    const updatedLine = {
      ...line,
      stops: updatedStops,
    };

    return adapter.updateOne(
      {
        id: lineId,
        changes: updatedLine,
      },
      state
    );
  }),

  on(TransitLinesActions.FilterStops, (state, { filter }) => ({
    ...state,
    filterLoading: true,
    filterError: null,
    currentFilter: filter
  })),

  on(TransitLinesActions.LoadFilteredStopsSuccess, (state, { stops }) => ({
    ...state,
    filteredStops: stops,
    filterLoading: false,
    currentFilter: state.currentFilter
  })),

  on(TransitLinesActions.LoadFilteredStopsFailure, (state, { error }) => ({
    ...state,
    filterError: error,
    filterLoading: false
  })),

  on(TransitLinesActions.CreateNewLineSuccess, (state, { line }) => {
    // Make sure we have a valid line with stops
    if (!line || !line.stops) {
      console.error('Invalid line data received:', line);
      return state;
    }
    return adapter.addOne(line, state);
  }),

  on(TransitLinesActions.DeleteLineSuccess, (state, { id }) =>
    adapter.removeOne(id, state)
  ),

  on(TransitLinesActions.SelectLine, (state, { selectedLineId }) => ({
    ...state,
    selectedLineId,
  }))
)
