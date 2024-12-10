export const PROPERTY_COLORS = {
  peopleOn: {
    low: '#ffcdd2',
    medium: '#e57373',
    high: '#e91e63'
  },
  peopleOff: {
    low: '#e1bee7',
    medium: '#ba68c8',
    high: '#9c27b0'
  },
  reachablePopulationWalk: {
    low: '#bbdefb',
    medium: '#64b5f6',
    high: '#2196f3'
  },
  reachablePopulationBike: {
    low: '#c8e6c9',
    medium: '#81c784',
    high: '#4caf50'
  },
  SELECTED: '#00ff00',
  HOVER: '#ffff00'
} as const;

// For interpolation on the map
export const VISUALIZATION_COLORS = {
  LOW: '#f44336',
  MEDIUM: '#ffc107',
  HIGH: '#4caf50',
} as const;