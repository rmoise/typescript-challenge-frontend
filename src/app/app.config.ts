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

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideStore(reducers),
    provideEffects(effects),
    provideHttpClient(),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75,
    }),
    provideAnimations(),
    importProvidersFrom(MatSnackBarModule),
  ],
}
