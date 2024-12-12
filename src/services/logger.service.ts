import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Service responsible for handling application logging.
 * Provides methods for logging messages and errors with production environment awareness.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  /**
   * Logs a message to the console in non-production environments
   * @param message The main message to log
   * @param args Additional arguments to log
   */
  log(message: string, ...args: any[]): void {
    if (!environment.production) {
      // eslint-disable-next-line no-console
      console.log(message, ...args);
    }
  }

  /**
   * Logs an error to the console in non-production environments
   * @param message The error message to log
   * @param args Additional arguments to log
   */
  error(message: string, ...args: any[]): void {
    if (!environment.production) {
      // eslint-disable-next-line no-console
      console.error(message, ...args);
    }
  }
}