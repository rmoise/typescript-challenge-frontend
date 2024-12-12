import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, computed, Signal } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { Store, select } from '@ngrx/store'
import { Map, GeoJSONSource, Popup, LngLatBounds } from 'maplibre-gl'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { environment } from 'src/environments/environment'
import { RootState } from 'src/store/app.store'
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions'
import { fromTransitLines } from 'src/store/transit-lines/transit-lines.selectors'
import { catchError, of, tap } from 'rxjs'
import { LoggerService } from '../services/logger.service'
import { FeatureCollection, Point } from 'geojson'
import { VISUALIZATION_COLORS } from 'src/constants/colors'
import { VisualizationProperty } from 'src/types/visualization'
import { NgIf } from '@angular/common'
import { MatDialog } from '@angular/material/dialog'
import { ManageLinesDialogComponent } from './manage-lines/manage-lines-dialog.component'
import { ApiService } from 'src/services/api.service'

interface LegendRange {
  color: string
  label: string
  range: string
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet, MatFormFieldModule, MatSelectModule, MatIconModule, MatButtonModule, NgIf],
})
export class AppComponent implements OnInit {
  // Define constants for source and layer IDs
  private readonly STOPS_SOURCE_ID = 'stops-source'
  private readonly LINES_SOURCE_ID = 'lines-source'
  private readonly STOPS_LAYER_ID = 'stops-layer'
  private readonly LINES_LAYER_ID = 'lines-layer'

  @ViewChild('map', { static: true }) private mapRef!: ElementRef<HTMLElement>
  @ViewChild('map') mapElement!: ElementRef
  private map!: Map
  private hoveredStateId: string | null = null
  private popup: Popup

  visualizationProperty = this.store.selectSignal(fromTransitLines.visualizationProperty)
  selectedStopId = this.store.selectSignal(fromTransitLines.selectedStopId)

  readonly legendRanges: Signal<LegendRange[]> = computed(() => {
    const property = this.visualizationProperty()
    const stopId = this.selectedStopId()

    // Return empty array if visualization is off and no stop is selected
    if (property === 'off' && !stopId) return []

    // If visualization is off but stop is selected, use peopleOn as default property
    const activeProperty = property === 'off' ? 'peopleOn' : property

    const maxValues = this.store.selectSignal(fromTransitLines.maxStopValues)()
    const maxValue = maxValues[activeProperty]

    return [
      {
        color: VISUALIZATION_COLORS.LOW,
        label: 'Low',
        range: `0 - ${Math.floor(maxValue * 0.33)}`,
      },
      {
        color: VISUALIZATION_COLORS.MEDIUM,
        label: 'Medium',
        range: `${Math.floor(maxValue * 0.33)} - ${Math.floor(maxValue * 0.66)}`,
      },
      {
        color: VISUALIZATION_COLORS.HIGH,
        label: 'High',
        range: `${Math.floor(maxValue * 0.66)} - ${maxValue}`,
      },
    ]
  })

  constructor(
    private store: Store<RootState>,
    private logger: LoggerService,
    private dialog: MatDialog,
    private apiService: ApiService
  ) {
    this.popup = new Popup({
      closeButton: false,
      closeOnClick: false,
    })

    this.apiService
      .getTransitLines()
      .pipe(
        tap((lines) => this.logger.log('Received lines from API:', lines)),
        catchError((error) => {
          this.logger.error('Error fetching transit lines:', error)
          return of([])
        })
      )
      .subscribe((lines) => {
        if (lines) {
          this.logger.log('Dispatching lines to store:', lines)
          lines.forEach((line) => {
            this.store.dispatch(TransitLinesActions.AddLine({ line }))
          })
        }
      })
  }

  ngOnInit(): void {
    // Initialize map
    this.map = new Map({
      container: this.mapRef.nativeElement,
      style: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${environment.maptilerApiKey}`,
      center: [13.404954, 52.520008],
      zoom: 13,
      fitBoundsOptions: {
        padding: 50,
      },
    })

    // Wait for both map load and initial data
    this.map.once('load', () => {
      // Set initial bounds to show all lines
      this.store
        .select(fromTransitLines.selectAll)
        .pipe(
          tap((lines) => {
            if (lines.length > 0) {
              const bounds = new LngLatBounds()
              // Include all stops from all lines in the bounds
              lines.forEach((line) => {
                line.stops.forEach((stop) => {
                  bounds.extend([stop.lng, stop.lat])
                })
              })
              this.map.fitBounds(bounds, {
                padding: 50,
                maxZoom: 13,
                duration: 1000,
              })
            }
          })
        )
        .subscribe()
        .unsubscribe()

      // Subscribe to stop selection changes to handle both map and sidebar clicks
      this.store.select(fromTransitLines.selectedStopId).subscribe((stopId) => {
        if (stopId) {
          console.log('Selected stop ID:', stopId)
          this.store
            .select(fromTransitLines.selectAll)
            .pipe(
              tap((lines) => {
                console.log(
                  'Looking for stop in lines:',
                  lines.map((l) => ({ id: l.id, stops: l.stops.map((s) => s.id) }))
                )
                // Find the line that contains the selected stop
                const line = lines.find((line) =>
                  line.stops.some((stop) => {
                    const match = stop.id === stopId
                    if (match) {
                      console.log('Found stop', stopId, 'in line', line.id)
                    }
                    return match
                  })
                )

                if (line) {
                  console.log(
                    'Focusing on line:',
                    line.id,
                    'with stops:',
                    line.stops.map((s) => s.id)
                  )
                  const bounds = new LngLatBounds()
                  // Only focus on the stops of the line that contains the selected stop
                  line.stops.forEach((stop) => {
                    bounds.extend([stop.lng, stop.lat])
                  })
                  this.map.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 15,
                    duration: 1000,
                  })
                } else {
                  console.warn('Stop not found in any line. Stop ID:', stopId)
                }
              })
            )
            .subscribe()
            .unsubscribe()
        }
      })

      const stopsSource$ = this.store.pipe(select(fromTransitLines.stopsPointGeoJson))

      stopsSource$.subscribe((source) => {
        if (typeof source === 'string') return

        const sourceData = source as unknown as { data: FeatureCollection }

        // Add line ID to each stop's properties
        this.store
          .select(fromTransitLines.selectAll)
          .pipe(
            tap((lines) => {
              sourceData.data.features = sourceData.data.features.map((feature) => {
                // Find which line this stop belongs to
                const lineId = lines.find((line) => line.stops.some((stop) => stop.id === feature.properties._id))?.id

                return {
                  ...feature,
                  id: feature.properties._id,
                  properties: {
                    ...feature.properties,
                    lineId: lineId, // Add line ID to properties
                  },
                }
              })

              const existingSource = this.map.getSource(this.STOPS_SOURCE_ID) as GeoJSONSource
              if (existingSource) {
                existingSource.setData(sourceData.data)
              } else {
                this.map.addSource(this.STOPS_SOURCE_ID, {
                  type: 'geojson',
                  data: sourceData.data,
                  promoteId: '_id',
                })
              }
            })
          )
          .subscribe()
          .unsubscribe()
      })

      this.setupStopsLayer()

      this.map.on('click', this.STOPS_LAYER_ID, (e) => {
        const features = this.map.queryRenderedFeatures(e.point, {
          layers: [this.STOPS_LAYER_ID],
        })

        if (features.length > 0) {
          const clickedStop = features[0]
          const stopId = clickedStop.properties._id
          const currentStopId = this.selectedStopId()
          if (stopId !== currentStopId) {
            this.store.dispatch(TransitLinesActions.SelectStop({ selectedStopId: stopId }))
          }
        }
      })

      this.map.on('mouseenter', this.STOPS_LAYER_ID, () => {
        this.map.getCanvas().style.cursor = 'pointer'
      })

      this.map.on('mousemove', this.STOPS_LAYER_ID, (e) => {
        if (e.features.length === 0) {
          if (this.hoveredStateId) {
            this.map.setFeatureState({ source: this.STOPS_SOURCE_ID, id: this.hoveredStateId }, { hover: false })
            this.hoveredStateId = null
            this.popup.remove()
          }
          return
        }

        const feature = e.features[0]
        if (feature.properties._id !== this.hoveredStateId) {
          if (this.hoveredStateId) {
            this.map.setFeatureState({ source: this.STOPS_SOURCE_ID, id: this.hoveredStateId }, { hover: false })
          }
          this.hoveredStateId = feature.properties._id
          this.map.setFeatureState({ source: this.STOPS_SOURCE_ID, id: this.hoveredStateId }, { hover: true })

          // Update popup
          const pointGeometry = feature.geometry as Point
          const coordinates = pointGeometry.coordinates.slice() as [number, number]
          const description = `
            <strong>${feature.properties.name}</strong><br>
            People getting on: ${feature.properties.peopleOn}<br>
            People getting off: ${feature.properties.peopleOff}<br>
            Within walking distance: ${feature.properties.reachablePopulationWalk}<br>
            Within biking distance: ${feature.properties.reachablePopulationBike}
          `

          this.popup.setLngLat(coordinates).setHTML(description).addTo(this.map)
        }
      })

      this.map.on('mouseleave', this.STOPS_LAYER_ID, () => {
        if (this.hoveredStateId) {
          this.map.setFeatureState({ source: this.STOPS_SOURCE_ID, id: this.hoveredStateId }, { hover: false })
          this.hoveredStateId = null
        }
        this.map.getCanvas().style.cursor = ''
        this.popup.remove()
      })

      const linesSource$ = this.store.pipe(select(fromTransitLines.stopsLinesGeoJson))

      linesSource$.subscribe((source) => {
        const existingSource = this.map.getSource(this.LINES_SOURCE_ID) as GeoJSONSource
        if (existingSource) {
          existingSource.setData(source.data)
        } else {
          this.map.addSource(this.LINES_SOURCE_ID, source)
        }
      })

      this.map.addLayer({
        id: this.LINES_LAYER_ID,
        type: 'line',
        source: this.LINES_SOURCE_ID,
        paint: {
          'line-color': [
            'match',
            ['get', 'lineId'],
            'u9',
            '#0000ff', // Blue for U9
            'u19',
            '#ff0000', // Red for U19
            '#666666', // Default gray
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            6, // Width when hovered
            4, // Default width
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.9, // Opacity when hovered
            0.7, // Default opacity
          ],
        },
      })

      // Add hover effect for lines
      let hoveredLineId: string | null = null

      this.map.on('mousemove', this.LINES_LAYER_ID, (e) => {
        if (e.features.length > 0) {
          if (hoveredLineId) {
            this.map.setFeatureState({ source: this.LINES_SOURCE_ID, id: hoveredLineId }, { hover: false })
          }
          hoveredLineId = e.features[0].properties.lineId
          this.map.setFeatureState({ source: this.LINES_SOURCE_ID, id: hoveredLineId }, { hover: true })
          this.map.getCanvas().style.cursor = 'pointer'
        }
      })

      this.map.on('mouseleave', this.LINES_LAYER_ID, () => {
        if (hoveredLineId) {
          this.map.setFeatureState({ source: this.LINES_SOURCE_ID, id: hoveredLineId }, { hover: false })
          hoveredLineId = null
        }
        this.map.getCanvas().style.cursor = ''
      })

      // Add click handler for lines
      this.map.on('click', this.LINES_LAYER_ID, (e) => {
        const features = this.map.queryRenderedFeatures(e.point, {
          layers: [this.LINES_LAYER_ID],
        })

        if (features.length > 0) {
          const clickedLine = features[0]
          const lineId = clickedLine.properties.lineId
          console.log('Clicked line ID:', lineId, 'Properties:', clickedLine.properties)

          this.store
            .select(fromTransitLines.selectAll)
            .pipe(
              tap((lines) => {
                console.log(
                  'Available lines:',
                  lines.map((l) => ({ id: l.id, stops: l.stops.length }))
                )
                // Try to find the line by exact ID first, then try case-insensitive
                let line =
                  lines.find((l) => l.id === lineId) || lines.find((l) => l.id.toLowerCase() === lineId.toLowerCase())

                if (line) {
                  console.log('Found matching line:', line.id, 'with stops:', line.stops)
                  const bounds = new LngLatBounds()
                  line.stops.forEach((stop) => {
                    bounds.extend([stop.lng, stop.lat])
                  })
                  this.map.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 15,
                    duration: 1000,
                  })
                } else {
                  console.warn(
                    'No matching line found for ID:',
                    lineId,
                    'Available IDs:',
                    lines.map((l) => l.id)
                  )
                }
              })
            )
            .subscribe()
            .unsubscribe()
        }
      })

      this.store.select(fromTransitLines.visualizationProperty).subscribe((property) => {
        if (this.map.getLayer(this.STOPS_LAYER_ID)) {
          this.map.setPaintProperty(this.STOPS_LAYER_ID, 'circle-color', [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            VISUALIZATION_COLORS.HIGH,
            ['get', 'visualizationColor'],
          ])

          // Only update the size for non-hover, non-selected states
          this.updateCircleSize(property)
        }
      })
    })
  }

  onVisualizationPropertyChange(
    property: 'off' | 'peopleOn' | 'peopleOff' | 'reachablePopulationWalk' | 'reachablePopulationBike'
  ): void {
    this.store.dispatch(TransitLinesActions.SetVisualizationProperty({ property }))
  }

  private updateCircleSize(property: VisualizationProperty) {
    if (!this.map.getLayer(this.STOPS_LAYER_ID)) return

    this.map.setPaintProperty(this.STOPS_LAYER_ID, 'circle-radius', [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      15,
      [
        'case',
        ['==', ['get', '_id'], ['get', 'selectedStopId']],
        12,
        property === 'off'
          ? 8
          : [
              'interpolate',
              ['linear'],
              ['get', property],
              0,
              6,
              100,
              8,
              500,
              10,
              1000,
              12,
              5000,
              14,
              10000,
              16,
              50000,
              18,
              100000,
              20,
            ],
      ],
    ])
  }

  getPropertyLabel(property: VisualizationProperty): string {
    if (property === 'off' && this.selectedStopId()) {
      return 'Stop Statistics'
    }

    switch (property) {
      case 'peopleOn':
        return 'People Getting On'
      case 'peopleOff':
        return 'People Getting Off'
      case 'reachablePopulationWalk':
        return 'Population Within Walking Distance'
      case 'reachablePopulationBike':
        return 'Population Within Biking Distance'
      default:
        return ''
    }
  }

  toggleVisualization(): void {
    const currentProperty = this.visualizationProperty()
    const newProperty: VisualizationProperty = currentProperty === 'off' ? 'peopleOn' : 'off'
    this.store.dispatch(TransitLinesActions.SetVisualizationProperty({ property: newProperty }))
  }

  private setupStopsLayer(): void {
    if (this.map.getLayer(this.STOPS_LAYER_ID)) return

    this.map.addLayer({
      id: this.STOPS_LAYER_ID,
      type: 'circle',
      source: this.STOPS_SOURCE_ID,
      paint: {
        'circle-radius': 8,
        'circle-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          VISUALIZATION_COLORS.HIGH,
          ['get', 'visualizationColor'],
        ],
        'circle-stroke-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          2,
          ['case', ['==', ['get', '_id'], ['get', 'selectedStopId']], 2, 0],
        ],
        'circle-stroke-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          '#ffffff',
          ['case', ['==', ['get', '_id'], ['get', 'selectedStopId']], '#ffffff', 'transparent'],
        ],
      },
    })

    let timeout: any
    this.store.select(fromTransitLines.selectedStopId).subscribe((selectedId) => {
      if (timeout) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(() => {
        if (this.map.getLayer(this.STOPS_LAYER_ID)) {
          const source = this.map.getSource(this.STOPS_SOURCE_ID) as GeoJSONSource
          if (source) {
            if (selectedId) {
              this.map.setFeatureState({ source: this.STOPS_SOURCE_ID, id: selectedId }, { selected: true })
            }
          }
        }
      }, 50)
    })
  }

  openManageLines() {
    this.dialog.open(ManageLinesDialogComponent)
  }
}
