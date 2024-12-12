export interface TransitStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  peopleOn: number;
  peopleOff: number;
  reachablePopulationWalk: number;
  reachablePopulationBike: number;
  prevId: string;
  nextId: string;
} 