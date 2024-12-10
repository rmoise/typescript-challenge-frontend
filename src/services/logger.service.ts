import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  log(message: string, ...args: any[]): void {
    if (!environment.production) {
      // eslint-disable-next-line no-console
      console.log(message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (!environment.production) {
      // eslint-disable-next-line no-console
      console.error(message, ...args);
    }
  }
} 