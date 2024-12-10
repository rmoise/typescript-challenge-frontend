import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { u9 } from 'src/constants/u9'
import { RootState } from 'src/store/app.store'
import { TransitLinesActions } from 'src/store/transit-lines/transit-lines.actions'
import { fromTransitLines } from 'src/store/transit-lines/transit-lines.selectors'
import { AppComponent } from './app.component'
import { TransitLinesService } from 'src/services/transit-lines.service'
import { of, throwError } from 'rxjs'
import { LoggerService } from '../services/logger.service'

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>
  let component: AppComponent
  let mockStore: MockStore<any>
  let dispatchSpy: jest.SpyInstance
  let mockTransitLinesService: jest.Mocked<TransitLinesService>
  let mockLogger: jest.Mocked<LoggerService>

  beforeEach(async () => {
    mockTransitLinesService = {
      getTransitLine: jest.fn().mockReturnValue(of(u9))
    } as any

    mockLogger = {
      error: jest.fn(),
      log: jest.fn()
    } as any

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideMockStore(),
        { provide: TransitLinesService, useValue: mockTransitLinesService },
        { provide: LoggerService, useValue: mockLogger }
      ],
    }).compileComponents()

    mockStore = TestBed.inject(Store) as MockStore<RootState>
    mockStore.overrideSelector(fromTransitLines.stopsPointGeoJson, null)
    dispatchSpy = jest.spyOn(mockStore, 'dispatch')

    fixture = TestBed.createComponent(AppComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  test('should create the app', () => {
    expect(component).toBeTruthy()
  })

  test('should fetch and add a line on init', () => {
    expect(mockTransitLinesService.getTransitLine).toHaveBeenCalledWith('u9')
    expect(dispatchSpy).toHaveBeenCalledWith(TransitLinesActions.AddLine({ line: u9 }))
  })

  test('should handle API error gracefully', () => {
    mockTransitLinesService.getTransitLine.mockReturnValue(
      throwError(() => new Error('Failed to connect to http://localhost:9000'))
    )

    fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching transit line:',
      expect.any(Error)
    )
    expect(dispatchSpy).not.toHaveBeenCalled()
  })

  test('should have a map', () => {
    expect(component['map']).toBeTruthy()
  })
})
