import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, catchError, tap } from 'rxjs'
import { TransitLine } from 'src/types/line'
import { environment } from 'src/environments/environment'

@Injectable({
  providedIn: 'root',
})
export class TransitLinesService {
  private readonly baseUrl = environment.apiUrl

  constructor(private http: HttpClient) {
    // Log the base URL during service initialization
    console.log('API Base URL:', this.baseUrl);
  }

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