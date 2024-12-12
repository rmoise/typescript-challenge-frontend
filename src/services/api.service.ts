import { Injectable } from '@angular/core'
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http'
import { Observable, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { environment } from 'src/environments/environment'
import { TransitLine, TransitStop } from 'src/types/line'
import { LoggerService } from 'src/services/logger.service'

interface StopFilter {
  peopleOn?: number
  peopleOff?: number
  reachablePopulationWalk?: number
  reachablePopulationBike?: number
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  private handleError(error: HttpErrorResponse) {
    this.logger.error('API Error Details:', {
      status: error.status,
      message: error.message,
      url: error.url,
      headers: error.headers,
      error: error.error,
    })

    let message = 'An error occurred'
    if (error.status === 404) {
      message = `Resource not found: ${error.url}. Please verify the backend server is running on port 9000`
    } else if (error.status === 0) {
      message = 'Unable to connect to the backend server. Please verify it is running.'
    } else if (error.status === 400) {
      message = error.error?.error || 'Invalid request. Please check your input.'
    }

    return throwError(() => new Error(message))
  }

  getTransitLines(): Observable<TransitLine[]> {
    const url = `${this.apiUrl}/transit-lines`
    this.logger.log('Attempting to fetch all transit lines from:', url)

    return this.http.get<TransitLine[]>(url).pipe(
      tap((lines) => this.logger.log('Successfully retrieved all lines:', lines)),
      catchError((error) => {
        this.logger.error('Failed to fetch transit lines:', error)
        return this.handleError(error)
      })
    )
  }

  updateStop(lineId: string, stopId: string, data: Partial<TransitStop>): Observable<TransitLine> {
    this.logger.log('Updating stop:', stopId, 'in line:', lineId, 'with data:', data)
    return this.http.patch<TransitLine>(`${this.apiUrl}/transit-lines/${lineId}/stops/${stopId}`, data).pipe(
      tap((line) => this.logger.log('Successfully updated stop:', stopId, 'in line:', line)),
      catchError((error) => {
        this.logger.error('Failed to update stop:', error)
        return this.handleError(error)
      })
    )
  }

  removeStop(lineId: string, stopId: string): Observable<TransitLine> {
    this.logger.log('Removing stop:', stopId, 'from line:', lineId)
    return this.http.delete<TransitLine>(`${this.apiUrl}/transit-lines/${lineId}/stops/${stopId}`).pipe(
      tap((line) => this.logger.log('Successfully removed stop:', stopId, 'from line:', line)),
      catchError((error) => {
        this.logger.error('Failed to remove stop:', error)
        return this.handleError(error)
      })
    )
  }

  getTransitLine(id: string): Observable<TransitLine> {
    this.logger.log('Fetching transit line:', id)
    return this.http.get<TransitLine>(`${this.apiUrl}/transit-lines/${id}`).pipe(
      tap((line) => this.logger.log('Successfully retrieved line:', line)),
      catchError((error) => {
        this.logger.error('Failed to fetch transit line:', error)
        return this.handleError(error)
      })
    )
  }

  addStop(lineId: string, stop: TransitStop): Observable<TransitLine> {
    this.logger.log('Adding stop to line:', lineId, 'stop data:', stop)
    return this.http.post<TransitLine>(`${this.apiUrl}/transit-lines/${lineId}/stops`, stop).pipe(
      tap((line) => this.logger.log('Successfully added stop to line:', line)),
      catchError((error) => {
        this.logger.error('Failed to add stop:', error)
        return this.handleError(error)
      })
    )
  }

  getFilteredStops(filter: StopFilter): Observable<TransitStop[]> {
    this.logger.log('Filtering stops with criteria:', filter)
    const params = new HttpParams({ fromObject: filter as any })
    return this.http.get<TransitStop[]>(`${this.apiUrl}/transit-lines/stops`, { params }).pipe(
      tap((stops) => this.logger.log('Successfully retrieved filtered stops:', stops)),
      catchError((error) => {
        this.logger.error('Failed to filter stops:', error)
        return this.handleError(error)
      })
    )
  }

  createTransitLine(id: string, stops: TransitStop[] = []): Observable<TransitLine> {
    this.logger.log('Creating transit line:', id, 'with stops:', stops)

    // Validate stops requirement before making the request
    if (!stops || stops.length < 2) {
      this.logger.error('Cannot create line: At least 2 stops are required')
      return throwError(() => new Error('At least 2 stops are required to create a line'))
    }

    return this.http.post<TransitLine>(`${this.apiUrl}/transit-lines/${id}`, { stops }).pipe(
      tap((response) => this.logger.log('Successfully created line:', response)),
      catchError((error) => {
        this.logger.error('Failed to create transit line:', error)
        return this.handleError(error)
      })
    )
  }

  deleteTransitLine(id: string): Observable<void> {
    this.logger.log('Deleting transit line:', id)
    return this.http.delete<void>(`${this.apiUrl}/transit-lines/${id}`).pipe(
      tap(() => this.logger.log('Successfully deleted line:', id)),
      catchError((error) => {
        this.logger.error('Failed to delete transit line:', error)
        return this.handleError(error)
      })
    )
  }
}
