import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, catchError, tap } from 'rxjs'
import { TransitLine } from 'src/types/line'
import { environment } from 'src/environments/environment'

/**
 * Service responsible for handling transit line-specific API communications.
 * Provides methods for retrieving transit line data with logging and error handling.
 */
@Injectable({
  providedIn: 'root',
})
export class TransitLinesService {
  /** Base URL for API requests */
  private readonly baseUrl = environment.apiUrl

  constructor(private http: HttpClient) {
    // Log the base URL during service initialization
    console.log('API Base URL:', this.baseUrl);
  }

  /**
   * Retrieves a specific transit line by ID
   * @param id The ID of the transit line to retrieve
   * @returns Observable of the requested TransitLine
   * @throws Error if the API request fails
   */
  getTransitLine(id: string): Observable<TransitLine> {
    const url = `${this.baseUrl}/transit-lines/${id}`;
    console.log('Requesting:', url);

    return this.http.get<TransitLine>(url).pipe(
      tap(response => console.log('API Response:', response)),
      catchError(error => {
        console.error('API Error:', error);
        throw error;
      })
    );
  }
}