import { createFeatureSelector, createSelector } from '@ngrx/store'
import { GeoJSONSourceSpecification } from 'maplibre-gl'
import { TRANSIT_LINES_KEY, adapter, TransitLinesState } from './transit-lines.reducer'
import { TransitLine } from 'src/types/line'
import { PROPERTY_COLORS } from 'src/constants/colors'
import { VisualizationProperty } from 'src/types/visualization'
import { FeatureCollection, Point } from 'geojson'

export namespace fromTransitLines {
  export const transitLinesState = createFeatureSelector<TransitLinesState>(TRANSIT_LINES_KEY)

  export const { selectAll, selectEntities, selectIds } = adapter.getSelectors(transitLinesState)

  export const selectedStopId = createSelector(transitLinesState, (state) => state.selectedStopId)

  export const visualizationProperty = createSelector(transitLinesState, (state) => state.visualizationProperty)

  export const allStops = createSelector(selectAll, (lines: TransitLine[]) => lines.map((line) => line.stops).flat())

  export const selectedStop = createSelector(selectedStopId, allStops, (selStopId, stops) =>
    stops.find((stop) => stop.id === selStopId)
  )

  /**
   * Mapbox source for the locations
   */
  export const stopsPointGeoJson = createSelector(
    selectAll,
    visualizationProperty,
    selectedStopId,
    (lines: TransitLine[], property: VisualizationProperty, selectedId: string | null) => ({
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: lines.flatMap((line) =>
          line.stops.map((stop) => ({
            type: 'Feature',
            id: stop.id,
            properties: {
              _id: stop.id,
              name: stop.name,
              selectedStopId: selectedId,
              visualizationProperty: property,
              visualizationColor: property === 'off' ? '#666666' : PROPERTY_COLORS[property],
              peopleOn: stop.peopleOn,
              peopleOff: stop.peopleOff,
              reachablePopulationWalk: stop.reachablePopulationWalk,
              reachablePopulationBike: stop.reachablePopulationBike
            },
            geometry: {
              type: 'Point',
              coordinates: [stop.lng, stop.lat],
            },
          }))
        ),
      },
    })
  )

  export const maxStopValues = createSelector(allStops, (stops) => ({
    off: 0,
    peopleOn: Math.max(...stops.map((stop) => stop.peopleOn)),
    peopleOff: Math.max(...stops.map((stop) => stop.peopleOff)),
    reachablePopulationWalk: Math.max(...stops.map((stop) => stop.reachablePopulationWalk)),
    reachablePopulationBike: Math.max(...stops.map((stop) => stop.reachablePopulationBike)),
  }))

  export const stopsLinesGeoJson = createSelector(
    selectAll,
    (lines: TransitLine[]) =>
      ({
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: lines.map((line) => ({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: line.stops.map((stop) => [stop.lng, stop.lat]),
            },
          })),
        },
      }) as GeoJSONSourceSpecification
  )

  export const getStopVisualizationValue = createSelector(selectedStop, visualizationProperty, (stop, property) => {
    if (!stop || property === 'off') return { label: '', value: 0 }

    switch (property) {
      case 'peopleOn':
        return { label: 'People getting on', value: stop.peopleOn }
      case 'peopleOff':
        return { label: 'People getting off', value: stop.peopleOff }
      case 'reachablePopulationWalk':
        return { label: 'Within 30min walk', value: stop.reachablePopulationWalk }
      case 'reachablePopulationBike':
        return { label: 'Within 30min bike', value: stop.reachablePopulationBike }
    }
  })

  export const stopsGeoJson = createSelector(
    transitLinesState,
    (state: TransitLinesState) => ({
      type: 'geojson' as const,
      data: {
        type: 'FeatureCollection',
        features: state.ids
          .map(id => state.entities[id])
          .filter(line => line !== undefined)
          .flatMap(line => line!.stops)
          .map(stop => ({
            type: 'Feature',
            id: stop.id,
            properties: {
              _id: stop.id,
              name: stop.name,
              peopleOn: stop.peopleOn,
              peopleOff: stop.peopleOff,
              reachablePopulationWalk: stop.reachablePopulationWalk,
              reachablePopulationBike: stop.reachablePopulationBike
            },
            geometry: {
              type: 'Point',
              coordinates: [stop.lng, stop.lat]
            }
          }))
      } as FeatureCollection<Point>
    }) as GeoJSONSourceSpecification
  )
}
