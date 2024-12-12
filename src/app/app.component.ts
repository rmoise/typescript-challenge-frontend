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
import { catchError, of, tap, take, filter, combineLatest, map } from 'rxjs'
import { LoggerService } from '../services/logger.service'
import { FeatureCollection, Point } from 'geojson'
import { VISUALIZATION_COLORS } from 'src/constants/colors'
import { VisualizationProperty } from 'src/types/visualization'
import { NgIf } from '@angular/common'
import { MatDialog } from '@angular/material/dialog'
import { ManageLinesDialogComponent } from './manage-lines/manage-lines-dialog.component'
import { ApiService } from 'src/services/api.service'
import { TransitLine } from 'src/types/line'

/**
 * Interface defining the structure for legend range items
 * Used for visualizing data ranges on the map
 */
interface LegendRange {
  color: string
  label: string
  range: string
}

/**
 * AppComponent is the root component of the application.
 * It handles the map visualization and integration with transit line data.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet, MatFormFieldModule, MatSelectModule, MatIconModule, MatButtonModule, NgIf],
})
export class AppComponent implements OnInit {
  // Constants for map source and layer IDs
  private readonly STOPS_SOURCE_ID = 'stops-source'
  private readonly LINES_SOURCE_ID = 'lines-source'
  private readonly STOPS_LAYER_ID = 'stops-layer'
  private readonly LINES_LAYER_ID = 'lines-layer'
  private readonly SELECTED_LINE_KEY = 'selectedLineId'

  // ViewChild references for map elements
  @ViewChild('map', { static: true }) private mapRef!: ElementRef<HTMLElement>
  @ViewChild('map') mapElement!: ElementRef

  // Map instance and related properties
  private map!: Map
  private hoveredStateId: string | null = null
  private popup: Popup

  // Signals for reactive state management
  visualizationProperty = this.store.selectSignal(fromTransitLines.visualizationProperty)
  selectedStopId = this.store.selectSignal(fromTransitLines.selectedStopId)

  private readonly selectedLine$ = this.store.select(fromTransitLines.selectedLineId);

  /**
   * Computed signal for legend ranges based on visualization property and selected stop
   */
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

    // Initialize transit lines data from API
    this.initializeTransitLines()

    // Set up line selection persistence
    this.selectedLine$.subscribe(lineId => {
      if (lineId) {
        localStorage.setItem(this.SELECTED_LINE_KEY, lineId)
      } else {
        localStorage.removeItem(this.SELECTED_LINE_KEY)
      }
    })
  }

  /**
   * Fetches initial transit lines data from the API
   */
  private initializeTransitLines(): void {
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
    // Initialize map with MapLibre
    this.initializeMap()

    // Wait for both map load and data load before setting up initial focus
    this.map.once('load', () => {
      // Set up map sources and layers first
      this.setupMapSources()
      this.setupMapLayers()
      this.setupMapEventListeners()

      // Restore selected line from localStorage
      const savedLineId = localStorage.getItem(this.SELECTED_LINE_KEY)
      if (savedLineId) {
        this.store.dispatch(TransitLinesActions.SelectLine({ selectedLineId: savedLineId }))
      }

      // Set up initial line focus when data is loaded
      combineLatest([
        this.store.select(fromTransitLines.selectAll),
        this.selectedLine$
      ]).pipe(
        filter(([lines]) => lines.length > 0),
        take(1)
      ).subscribe(([lines, selectedLineId]) => {
        const lineToFocus = selectedLineId ?
          lines.find(l => l.id === selectedLineId) :
          lines[0];

        if (lineToFocus) {
          const bounds = new LngLatBounds()
          lineToFocus.stops.forEach(stop => {
            bounds.extend([stop.lng, stop.lat])
          })
          this.fitMapToBounds(bounds)
        }
      })
    })
  }

  /**
   * Initializes the map and sets up event listeners
   */
  private initializeMap(): void {
    this.map = new Map({
      container: this.mapRef.nativeElement,
      style: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${environment.maptilerApiKey}`,
      center: [13.404954, 52.520008],
      zoom: 13,
      fitBoundsOptions: {
        padding: 50,
      },
    })
  }

  /**
   * Sets up the map data sources for stops and lines
   */
  private setupMapSources(): void {
    // Add initial empty sources
    this.map.addSource(this.STOPS_SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    this.map.addSource(this.LINES_SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    // Subscribe to stops source changes
    this.store.pipe(select(fromTransitLines.stopsPointGeoJson))
      .subscribe(this.handleStopsSourceUpdate.bind(this))

    // Subscribe to lines source changes
    this.store.pipe(select(fromTransitLines.stopsLinesGeoJson))
      .subscribe(this.handleLinesSourceUpdate.bind(this))
  }

  /**
   * Sets up the map layers for visualization
   */
  private setupMapLayers(): void {
    // Add layers for stops and lines
    this.addStopsLayer()
    this.addLinesLayer()

    // Subscribe to visualization property changes
    this.store.select(fromTransitLines.visualizationProperty)
      .subscribe(this.updateVisualization.bind(this))
  }

  /**
   * Updates the map visualization based on the selected property
   */
  private updateVisualization(property: VisualizationProperty): void {
    if (this.map.getLayer(this.STOPS_LAYER_ID)) {
      this.map.setPaintProperty(this.STOPS_LAYER_ID, 'circle-color', [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        VISUALIZATION_COLORS.HIGH,
        ['get', 'visualizationColor'],
      ])

      this.updateCircleSize(property)
    }
  }

  /**
   * Updates the circle size of stops based on the visualization property
   */
  private updateCircleSize(property: VisualizationProperty): void {
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

  /**
   * Handles updates to the stops source data
   */
  private handleStopsSourceUpdate(source: any): void {
    if (typeof source === 'string') return

    const sourceData = source as unknown as { data: FeatureCollection }

    // Add line ID to each stop's properties
    this.store
      .select(fromTransitLines.selectAll)
      .pipe(
        tap((lines) => {
          sourceData.data.features = sourceData.data.features.map((feature) => {
            // Find which line this stop belongs to
            const lineId = lines.find((line) =>
              line.stops.some((stop) => stop.id === feature.properties._id))?.id

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
  }

  /**
   * Handles updates to the lines source data
   */
  private handleLinesSourceUpdate(source: any): void {
    const existingSource = this.map.getSource(this.LINES_SOURCE_ID) as GeoJSONSource
    if (existingSource) {
      existingSource.setData(source.data)
    } else {
      this.map.addSource(this.LINES_SOURCE_ID, source)
    }
  }

  /**
   * Sets up event listeners for map interactions
   */
  private setupMapEventListeners(): void {
    // Set up click handlers for stops and lines
    this.setupStopClickHandler()
    this.setupLineClickHandler()

    // Set up hover handlers for stops and lines
    this.setupStopHoverHandler()
    this.setupLineHoverHandler()

    // Subscribe to stop selection changes
    this.setupStopSelectionHandler()
  }

  /**
   * Sets up the click handler for stops on the map
   */
  private setupStopClickHandler(): void {
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
  }

  /**
   * Sets up the click handler for lines on the map
   */
  private setupLineClickHandler(): void {
    this.map.on('click', this.LINES_LAYER_ID, (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: [this.LINES_LAYER_ID],
      })

      if (features.length > 0) {
        const clickedLine = features[0]
        const lineId = clickedLine.properties.lineId

        // Dispatch action to select the line
        this.store.dispatch(TransitLinesActions.SelectLine({ selectedLineId: lineId }))

        // Focus on the line
        this.focusOnLine(lineId)
      }
    })
  }

  /**
   * Focuses the map view on a specific line
   */
  private focusOnLine(lineId: string): void {
    this.store
      .select(fromTransitLines.selectAll)
      .pipe(
        take(1),
        map(lines => lines.find(l => l.id === lineId)),
        filter((line): line is TransitLine => line !== undefined),
        tap(line => {
          const bounds = new LngLatBounds()
          line.stops.forEach(stop => {
            bounds.extend([stop.lng, stop.lat])
          })
          this.fitMapToBounds(bounds)
        })
      )
      .subscribe()
  }

  /**
   * Sets up hover handlers for stops on the map
   */
  private setupStopHoverHandler(): void {
    this.map.on('mouseenter', this.STOPS_LAYER_ID, () => {
      this.map.getCanvas().style.cursor = 'pointer'
    })

    this.map.on('mousemove', this.STOPS_LAYER_ID, this.handleStopHover.bind(this))

    this.map.on('mouseleave', this.STOPS_LAYER_ID, () => {
      if (this.hoveredStateId) {
        this.map.setFeatureState(
          { source: this.STOPS_SOURCE_ID, id: this.hoveredStateId },
          { hover: false }
        )
        this.hoveredStateId = null
      }
      this.map.getCanvas().style.cursor = ''
      this.popup.remove()
    })
  }

  /**
   * Handles hover events for stops on the map
   */
  private handleStopHover(e: any): void {
    if (e.features.length === 0) {
      if (this.hoveredStateId) {
        this.map.setFeatureState(
          { source: this.STOPS_SOURCE_ID, id: this.hoveredStateId },
          { hover: false }
        )
        this.hoveredStateId = null
        this.popup.remove()
      }
      return
    }

    const feature = e.features[0]
    if (feature.properties._id !== this.hoveredStateId) {
      if (this.hoveredStateId) {
        this.map.setFeatureState(
          { source: this.STOPS_SOURCE_ID, id: this.hoveredStateId },
          { hover: false }
        )
      }
      this.hoveredStateId = feature.properties._id
      this.map.setFeatureState(
        { source: this.STOPS_SOURCE_ID, id: this.hoveredStateId },
        { hover: true }
      )

      this.updatePopup(feature)
    }
  }

  /**
   * Updates the popup content for a hovered stop
   */
  private updatePopup(feature: any): void {
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

  /**
   * Sets up hover handlers for lines on the map
   */
  private setupLineHoverHandler(): void {
    let hoveredLineId: string | null = null

    this.map.on('mousemove', this.LINES_LAYER_ID, (e) => {
      if (e.features.length > 0) {
        if (hoveredLineId) {
          this.map.setFeatureState(
            { source: this.LINES_SOURCE_ID, id: hoveredLineId },
            { hover: false }
          )
        }
        hoveredLineId = e.features[0].properties.lineId
        this.map.setFeatureState(
          { source: this.LINES_SOURCE_ID, id: hoveredLineId },
          { hover: true }
        )
        this.map.getCanvas().style.cursor = 'pointer'
      }
    })

    this.map.on('mouseleave', this.LINES_LAYER_ID, () => {
      if (hoveredLineId) {
        this.map.setFeatureState(
          { source: this.LINES_SOURCE_ID, id: hoveredLineId },
          { hover: false }
        )
        hoveredLineId = null
      }
      this.map.getCanvas().style.cursor = ''
    })
  }

  /**
   * Sets up the handler for stop selection changes
   */
  private setupStopSelectionHandler(): void {
    this.store.select(fromTransitLines.selectedStopId).subscribe((stopId) => {
      if (stopId) {
        this.focusOnSelectedStop(stopId)
      }
    })
  }

  /**
   * Focuses the map view on a selected stop
   */
  private focusOnSelectedStop(stopId: string): void {
    this.store
      .select(fromTransitLines.selectAll)
      .pipe(
        tap((lines) => {
          const line = lines.find((line) =>
            line.stops.some((stop) => stop.id === stopId)
          )

          if (line) {
            const bounds = new LngLatBounds()
            line.stops.forEach((stop) => {
              bounds.extend([stop.lng, stop.lat])
            })
            this.map.fitBounds(bounds, {
              padding: 50,
              maxZoom: 15,
              duration: 1000,
            })
          }
        })
      )
      .subscribe()
      .unsubscribe()
  }

  /**
   * Adds the stops layer to the map
   */
  private addStopsLayer(): void {
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
  }

  /**
   * Adds the lines layer to the map
   */
  private addLinesLayer(): void {
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
          [
            'case',
            ['==', ['get', 'lineId'], ['coalesce', ['get', 'selectedLineId'], '']],
            5, // Width when selected
            4, // Default width
          ],
        ],
        'line-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.9, // Opacity when hovered
          [
            'case',
            ['==', ['get', 'lineId'], ['coalesce', ['get', 'selectedLineId'], '']],
            0.9, // Opacity when selected
            0.7, // Default opacity
          ],
        ],
      },
    })

    // Subscribe to selected line changes to update the layer
    this.selectedLine$.subscribe(selectedLineId => {
      const source = this.map.getSource(this.LINES_SOURCE_ID) as GeoJSONSource
      if (source) {
        const data = (source as any)._data;
        if (data) {
          data.features = data.features.map((feature: any) => ({
            ...feature,
            properties: {
              ...feature.properties,
              selectedLineId: selectedLineId
            }
          }));
          source.setData(data);
        }
      }
    });
  }

  /**
   * Changes the visualization property for the map
   */
  onVisualizationPropertyChange(property: VisualizationProperty): void {
    this.store.dispatch(TransitLinesActions.SetVisualizationProperty({ property }))
  }

  /**
   * Gets the label for a visualization property
   */
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

  /**
   * Toggles the visualization on/off
   */
  toggleVisualization(): void {
    const currentProperty = this.visualizationProperty()
    const newProperty: VisualizationProperty = currentProperty === 'off' ? 'peopleOn' : 'off'
    this.store.dispatch(TransitLinesActions.SetVisualizationProperty({ property: newProperty }))
  }

  /**
   * Opens the manage lines dialog
   */
  openManageLines(): void {
    this.dialog.open(ManageLinesDialogComponent)
  }

  /**
   * Fits the map view to the given bounds
   */
  private fitMapToBounds(bounds: LngLatBounds): void {
    this.map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 13,
      duration: 1000,
    })
  }
}
