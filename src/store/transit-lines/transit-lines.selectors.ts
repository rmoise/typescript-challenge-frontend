import { createFeatureSelector, createSelector } from '@ngrx/store'
import { GeoJSONSourceSpecification } from 'maplibre-gl'
import { TRANSIT_LINES_KEY, adapter, TransitLinesState } from './transit-lines.reducer'
import { TransitLine } from 'src/types/line'
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

  export const maxStopValues = createSelector(allStops, (stops) => ({
    off: 0,
    peopleOn: Math.max(...stops.map((stop) => stop.peopleOn)),
    peopleOff: Math.max(...stops.map((stop) => stop.peopleOff)),
    reachablePopulationWalk: Math.max(...stops.map((stop) => stop.reachablePopulationWalk)),
    reachablePopulationBike: Math.max(...stops.map((stop) => stop.reachablePopulationBike)),
  }))

  export const filteredStops = createSelector(transitLinesState, (state) => state.filteredStops)

  export const filterLoading = createSelector(transitLinesState, (state) => state.filterLoading)

  export const filterError = createSelector(transitLinesState, (state) => state.filterError)

  export const currentFilter = createSelector(transitLinesState, (state) => state.currentFilter)

  /**
   * Mapbox source for the locations
   */
  export const stopsPointGeoJson = createSelector(
    selectAll,
    visualizationProperty,
    selectedStopId,
    maxStopValues,
    filteredStops,
    (lines: TransitLine[], property: VisualizationProperty, selectedId: string | null, maxValues, filteredStops) => {
      const allStops = lines.flatMap((line) => line.stops)

      const stopsToShow = filteredStops.length > 0 ? filteredStops : allStops

      const result = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stopsToShow.map((stop) => {
            let visualizationColor = '#666666'
            let strokeColor = 'transparent'
            let strokeWidth = 0

            if (property !== 'off') {
              const value = stop[property]
              const maxValue = maxValues[property]
              const percentage = (value / maxValue) * 100

              if (percentage >= 66) {
                visualizationColor = '#4caf50' // HIGH - Green
              } else if (percentage >= 33) {
                visualizationColor = '#ffc107' // MEDIUM - Yellow/Amber
              } else {
                visualizationColor = '#f44336' // LOW - Red
              }

              // Add white stroke for hover/selected state
              if (stop.id === selectedId) {
                strokeColor = '#ffffff'
                strokeWidth = 2
              }
            } else if (stop.id === selectedId) {
              const percentage = (stop.peopleOn / maxValues.peopleOn) * 100
              if (percentage >= 66) {
                visualizationColor = '#4caf50'
              } else if (percentage >= 33) {
                visualizationColor = '#ffc107'
              } else {
                visualizationColor = '#f44336'
              }
              strokeColor = '#ffffff'
              strokeWidth = 2
            }

            return {
              type: 'Feature',
              id: stop.id,
              properties: {
                _id: stop.id,
                name: stop.name,
                selectedStopId: selectedId,
                visualizationProperty: property,
                visualizationColor,
                strokeColor,
                strokeWidth,
                peopleOn: stop.peopleOn,
                peopleOff: stop.peopleOff,
                reachablePopulationWalk: stop.reachablePopulationWalk,
                reachablePopulationBike: stop.reachablePopulationBike,
              },
              geometry: {
                type: 'Point',
                coordinates: [stop.lng, stop.lat],
              },
            }
          }),
        },
      }

      return result
    }
  )

  export const stopsLinesGeoJson = createSelector(selectAll, filteredStops, (lines: TransitLine[], filteredStops) => {
    // If there are filtered stops, only show those connections
    if (filteredStops.length > 0) {
      return {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: filteredStops.map((stop) => [stop.lng, stop.lat]),
              },
            },
          ],
        },
      } as GeoJSONSourceSpecification;
    }

    // Otherwise, create separate line features for each transit line
    return {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: lines.map(line => ({
          type: 'Feature',
          properties: {
            lineId: line.id
          },
          geometry: {
            type: 'LineString',
            coordinates: line.stops.map((stop) => [stop.lng, stop.lat]),
          },
        })),
      },
    } as GeoJSONSourceSpecification;
  })

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
    (state: TransitLinesState) =>
      ({
        type: 'geojson' as const,
        data: {
          type: 'FeatureCollection',
          features: state.ids
            .map((id) => state.entities[id])
            .filter((line) => line !== undefined)
            .flatMap((line) => line!.stops)
            .map((stop) => ({
              type: 'Feature',
              id: stop.id,
              properties: {
                _id: stop.id,
                name: stop.name,
                peopleOn: stop.peopleOn,
                peopleOff: stop.peopleOff,
                reachablePopulationWalk: stop.reachablePopulationWalk,
                reachablePopulationBike: stop.reachablePopulationBike,
              },
              geometry: {
                type: 'Point',
                coordinates: [stop.lng, stop.lat],
              },
            })),
        } as FeatureCollection<Point>,
      }) as GeoJSONSourceSpecification
  )

  export const selectedLineId = createSelector(transitLinesState, (state) => state.selectedLineId)

  export const selectedLine = createSelector(
    selectEntities,
    selectedLineId,
    (entities, lineId) => lineId ? entities[lineId] : null
  )
}
