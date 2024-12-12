import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideEffects } from '@ngrx/effects'
import { provideStore } from '@ngrx/store'
import { provideStoreDevtools } from '@ngrx/store-devtools'
import { effects, reducers } from 'src/store/app.store'
import { routes } from './app.routes'
import { provideHttpClient } from '@angular/common/http'
import { provideAnimations } from '@angular/platform-browser/animations'
import { MatSnackBarModule } from '@angular/material/snack-bar'

/**
 * Main application configuration object that provides necessary dependencies and services.
 * This includes:
 * - Routing configuration
 * - NgRx store and effects setup
 * - HTTP client for API communication
 * - Animation support
 * - Material design components
 * - Development tools configuration
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Configure routing with defined routes
    provideRouter(routes),

    // Set up NgRx store with reducers for state management
    provideStore(reducers),

    // Configure NgRx effects for handling side effects
    provideEffects(effects),

    // Enable HTTP client for API communication
    provideHttpClient(),

    // Configure NgRx dev tools for development environment
    provideStoreDevtools({
      maxAge: 25, // Maximum number of states to retain
      logOnly: !isDevMode(), // Log-only in production
      autoPause: true, // Pause recording actions and state changes when extension window is not open
      trace: false, // Don't include stack trace in action logs
      traceLimit: 75, // Limit for stack trace elements
    }),

    // Enable Angular animations
    provideAnimations(),

    // Import Material Snackbar module
    importProvidersFrom(MatSnackBarModule),
  ],
}
