import { createEntityAdapter, EntityState } from '@ngrx/entity'
import { createReducer, on } from '@ngrx/store'
import { TransitLine } from 'src/types/line'
import { TransitLinesActions } from './transit-lines.actions'

export const TRANSIT_LINES_KEY = 'transit-lines'

export interface TransitLinesState extends EntityState<TransitLine> {
  selectedStopId: string | null
  visualizationProperty: 'off' | 'peopleOn' | 'peopleOff' | 'reachablePopulationWalk' | 'reachablePopulationBike'
}

export const adapter = createEntityAdapter<TransitLine>()

export const initialState: TransitLinesState = adapter.getInitialState({
  selectedStopId: null,
  visualizationProperty: 'off' as const,
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

  on(TransitLinesActions.CreateNewLine, (state, { id }) => adapter.addOne(
    {
      id,
      stops: [],
    },
    state
  ))
)
