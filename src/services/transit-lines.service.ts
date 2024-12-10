import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { TransitLine } from 'src/types/line'
import { environment } from 'src/environments/environment'

@Injectable({
  providedIn: 'root',
})
export class TransitLinesService {
  private readonly baseUrl = environment.apiUrl

  constructor(private http: HttpClient) {}

  getTransitLine(id: string): Observable<TransitLine> {
    return this.http.get<TransitLine>(`${this.baseUrl}/transit-lines/${id}`)
  }
} 