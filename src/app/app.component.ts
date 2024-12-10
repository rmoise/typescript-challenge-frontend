import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { Store, select } from '@ngrx/store'
import { Map, GeoJSONSource, Popup, LngLatBounds } from 'maplibre-gl'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { environment } from 'src/environments/environment'
import { RootState } from 'src/store/app.store'
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions'
import { TransitLinesService } from 'src/services/transit-lines.service'
import { fromTransitLines } from 'src/store/transit-lines/transit-lines.selectors'
import { catchError, of, tap } from 'rxjs'
import { LoggerService } from '../services/logger.service'
import { FeatureCollection, Point, Feature } from 'geojson'
import { PROPERTY_COLORS } from 'src/constants/colors'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet, MatFormFieldModule, MatSelectModule],
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

  constructor(
    private store: Store<RootState>,
    private transitLinesService: TransitLinesService,
    private logger: LoggerService
  ) {
    this.popup = new Popup({
      closeButton: false,
      closeOnClick: false,
    })

    this.transitLinesService
      .getTransitLine('u9')
      .pipe(
        tap((line) => this.logger.log('Received from API:', line)),
        catchError((error) => {
          this.logger.error('Error fetching transit line:', error)
          return of(null)
        })
      )
      .subscribe((line) => {
        if (line) {
          this.logger.log('Dispatching to store:', line)
          this.store.dispatch(TransitLinesActions.AddLine({ line }))
        }
      })

    // Clear selected stop on app initialization
    this.store.dispatch(TransitLinesActions.SelectStop({ selectedStopId: null }))
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
      const stopsSource$ = this.store.pipe(select(fromTransitLines.stopsPointGeoJson))

      stopsSource$.subscribe((source) => {
        if (typeof source === 'string') return

        const sourceData = source as unknown as { data: FeatureCollection }
        sourceData.data.features = sourceData.data.features.map((feature) => {
          const featureId = feature.properties._id;
          return {
            ...feature,
            id: featureId,
            properties: {
              ...feature.properties,
              visualizationColor: PROPERTY_COLORS[this.visualizationProperty() || 'off']
            }
          };
        })

        const existingSource = this.map.getSource(this.STOPS_SOURCE_ID) as GeoJSONSource
        if (existingSource) {
          existingSource.setData(sourceData.data)
        } else {
          this.map.addSource(this.STOPS_SOURCE_ID, {
            type: 'geojson',
            data: sourceData.data,
            promoteId: '_id'
          })
        }

        // Fit bounds to the features after adding them
        if (sourceData.data.features.length > 0) {
          const bounds = new LngLatBounds()
          sourceData.data.features.forEach((feature: Feature) => {
            if (feature.geometry.type === 'Point') {
              const point = feature.geometry as Point
              bounds.extend(point.coordinates as [number, number])
            }
          })
          this.map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 13,
          })
        }
      })

      this.map.addLayer({
        id: this.STOPS_LAYER_ID,
        type: 'circle',
        source: this.STOPS_SOURCE_ID,
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            15,
            [
              'case',
              ['==', ['get', '_id'], ['get', 'selectedStopId']],
              12,
              8
            ]
          ],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffff00',
            [
              'case',
              ['==', ['get', '_id'], ['get', 'selectedStopId']],
              '#00ff00',
              ['get', 'visualizationColor']
            ]
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      })

      this.map.on('click', this.STOPS_LAYER_ID, (e) => {
        const features = this.map.queryRenderedFeatures(e.point, {
          layers: [this.STOPS_LAYER_ID],
        })

        if (features.length > 0) {
          const clickedStop = features[0]
          const stopId = clickedStop.properties._id
          this.store.dispatch(TransitLinesActions.SelectStop({ selectedStopId: stopId }))
        }
      })

      this.map.on('mouseenter', this.STOPS_LAYER_ID, () => {
        this.map.getCanvas().style.cursor = 'pointer'
      })

      this.map.on('mousemove', this.STOPS_LAYER_ID, (e) => {
        if (e.features.length === 0) {
          if (this.hoveredStateId) {
            this.map.setFeatureState(
              { source: this.STOPS_SOURCE_ID, id: this.hoveredStateId },
              { hover: false }
            );
            this.hoveredStateId = null;
            this.popup.remove();
          }
          return;
        }

        const feature = e.features[0];
        if (feature.properties._id !== this.hoveredStateId) {
          if (this.hoveredStateId) {
            this.map.setFeatureState(
              { source: this.STOPS_SOURCE_ID, id: this.hoveredStateId },
              { hover: false }
            );
          }
          this.hoveredStateId = feature.properties._id;
          this.map.setFeatureState(
            { source: this.STOPS_SOURCE_ID, id: this.hoveredStateId },
            { hover: true }
          );

          // Update popup
          const pointGeometry = feature.geometry as Point;
          const coordinates = pointGeometry.coordinates.slice() as [number, number];
          const description = `
            <strong>${feature.properties.name}</strong><br>
            People getting on: ${feature.properties.peopleOn}<br>
            People getting off: ${feature.properties.peopleOff}<br>
            Within walking distance: ${feature.properties.reachablePopulationWalk}<br>
            Within biking distance: ${feature.properties.reachablePopulationBike}
          `;

          this.popup
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(this.map);
        }
      });

      this.map.on('mouseleave', this.STOPS_LAYER_ID, () => {
        if (this.hoveredStateId) {
          this.map.setFeatureState(
            { source: this.STOPS_SOURCE_ID, id: this.hoveredStateId },
            { hover: false }
          );
          this.hoveredStateId = null;
        }
        this.map.getCanvas().style.cursor = '';
        this.popup.remove();
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
          'line-color': '#0000ff',
          'line-width': 3,
          'line-opacity': 0.8,
        },
      })

      this.store.select(fromTransitLines.visualizationProperty).subscribe((property) => {
        if (this.map.getLayer(this.STOPS_LAYER_ID)) {
          this.map.setPaintProperty(this.STOPS_LAYER_ID, 'circle-color', [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ffff00',
            [
              'case',
              ['==', ['get', '_id'], ['get', 'selectedStopId']],
              '#00ff00',
              property === 'off' ? '#666666' : PROPERTY_COLORS[property],
            ],
          ])

          // Only update the size for non-hover, non-selected states
          this.map.setPaintProperty(this.STOPS_LAYER_ID, 'circle-radius', [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            10,
            [
              'case',
              ['==', ['get', '_id'], ['get', 'selectedStopId']],
              12,
              property === 'off' ? 6 : ['interpolate', ['linear'], ['get', property], 0, 6, 1000, 20],
            ],
          ])
        }
      })
    })
  }

  onVisualizationPropertyChange(
    property: 'off' | 'peopleOn' | 'peopleOff' | 'reachablePopulationWalk' | 'reachablePopulationBike'
  ): void {
    this.store.dispatch(TransitLinesActions.SetVisualizationProperty({ property }))
  }
}
