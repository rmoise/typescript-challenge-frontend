import { Routes } from '@angular/router'
import { DetailComponent } from './detail/detail.component'
import { HomeComponent } from './home/home.component'

/**
 * Application routing configuration.
 * Defines the mapping between URL paths and components.
 */
export const routes: Routes = [
  // Home route - displays the main transit lines view
  {
    path: 'home',
    component: HomeComponent,
  },

  // Detail route - displays detailed information about a specific transit line or stop
  {
    path: 'detail',
    component: DetailComponent
  },

  // Wildcard route - redirects any undefined paths to the home page
  {
    path: '**',
    redirectTo: '/home',
    pathMatch: 'full',
  },
]
