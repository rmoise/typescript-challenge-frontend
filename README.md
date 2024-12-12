# Transit Lines Application

## Overview
A modern Angular application for managing and visualizing transit lines and their stops. The application provides an interactive map interface to view transit lines, manage stops, and analyze passenger data.

## Features
- 🗺️ Interactive map visualization using MapLibre GL
- 📊 Real-time data visualization for:
  - Passenger boarding/alighting counts
  - Population reachability analysis (walking/biking)
  - Stop-specific statistics
- ✨ Modern UI with Material Design
- 🚉 Transit line management:
  - Add/remove transit lines
  - Add/edit/remove stops
  - Filter stops based on various criteria
- 📱 Responsive design with mobile support
- 🔄 Real-time state management with NgRx
- 🎯 OnPush change detection for optimal performance

## Technical Stack
- **Framework**: Angular 18.2.4
- **State Management**: NgRx 18.0.2
- **UI Components**: Angular Material 18.2.4
- **Maps**: MapLibre GL 4.7.0
- **Build Tools**: Angular CLI 18.2.4
- **Testing**: Jest 29.7.0
- **Styling**: SCSS with Material Design

## Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- A MapTiler API key

## Setup and Installation
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd typescript-challenge-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   Create a `.env` file in the root directory with:
   ```
   MAPTILER_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run serve
   ```

5. Open your browser and navigate to `http://localhost:4200`

## Project Structure
```
src/
├── app/                    # Application components
│   ├── home/              # Home component (main view)
│   ├── detail/            # Detail component (stop details)
│   ├── manage-lines/      # Line management dialogs
│   └── styles/            # Global styles
├── services/              # API and utility services
├── store/                 # NgRx state management
├── types/                 # TypeScript interfaces
└── environments/          # Environment configurations
```

## Key Components

### Home Component
The main view displaying the transit lines list and map interface. Features:
- Expandable transit line list
- Stop visualization
- Floating action button for line management

### Detail Component
Displays detailed information about selected stops:
- Passenger statistics
- Population reachability data
- Stop editing capabilities

### Map Visualization
Interactive map showing:
- Transit line routes
- Stop locations with real-time data
- Color-coded visualization based on selected metrics

## State Management
Uses NgRx for predictable state management:
- Actions for all transit line operations
- Selectors for computed data visualization
- Effects for API communication
- Entity adapters for efficient data management

## API Integration
RESTful API integration with endpoints for:
- Transit line CRUD operations
- Stop management
- Data filtering and visualization

## Testing
- Unit tests using Jest
- Component testing with Angular Testing Library
- E2E testing capabilities

Run tests with:
```bash
npm test
```

## Code Quality
- ESLint configuration for code quality
- Prettier for code formatting
- Angular style guide compliance
- Strict TypeScript configuration

Run linting:
```bash
npm run lint
```

Format code:
```bash
npm run prettier
```

## Performance Optimizations
- OnPush change detection
- Lazy loading of components
- Efficient state management with NgRx
- Optimized map rendering

## Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast support

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Improvements
- [ ] Real-time transit updates
- [ ] Advanced filtering capabilities
- [ ] User authentication
- [ ] Mobile app version
- [ ] Offline support
- [ ] Multi-language support

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Angular team for the amazing framework
- MapLibre GL for the mapping capabilities
- Material Design team for the UI components
