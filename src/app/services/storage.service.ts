import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WeatherResponse } from './weather.service';

export interface SavedLocation {
  id: string;
  name: string;
  weatherData: WeatherResponse;
  savedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly SAVED_LOCATION_KEY = 'savedLocation';
  private savedLocationSubject = new BehaviorSubject<SavedLocation | null>(null);

  constructor() {
    this.loadSavedLocation();
  }

  private loadSavedLocation(): void {
    try {
      const saved = localStorage.getItem(this.SAVED_LOCATION_KEY);
      if (saved) {
        const location: SavedLocation = JSON.parse(saved);
        // Convert savedAt back to Date object
        location.savedAt = new Date(location.savedAt);
        this.savedLocationSubject.next(location);
      }
    } catch (error) {
      console.warn('Failed to load saved location:', error);
      this.savedLocationSubject.next(null);
    }
  }

  saveLocation(weatherData: WeatherResponse, customName?: string): void {
    try {
      const location: SavedLocation = {
        id: `saved_${Date.now()}`,
        name: customName || this.extractLocationName(weatherData),
        weatherData,
        savedAt: new Date()
      };

      localStorage.setItem(this.SAVED_LOCATION_KEY, JSON.stringify(location));
      this.savedLocationSubject.next(location);
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  }

  getSavedLocation(): Observable<SavedLocation | null> {
    return this.savedLocationSubject.asObservable();
  }

  hasSavedLocation(): boolean {
    return this.savedLocationSubject.value !== null;
  }

  removeSavedLocation(): void {
    try {
      localStorage.removeItem(this.SAVED_LOCATION_KEY);
      this.savedLocationSubject.next(null);
    } catch (error) {
      console.error('Failed to remove saved location:', error);
    }
  }

  private extractLocationName(weatherData: WeatherResponse): string {
    // Extract city name from the location address
    const address = weatherData.location.address;
    const addressParts = address.split(',').map(part => part.trim());
    
    // Look for the best city/neighborhood name
    for (let i = 0; i < Math.min(4, addressParts.length); i++) {
      const part = addressParts[i];
      
      // Skip postal codes and numbers
      if (part.match(/^\d+/) || part.match(/^\d+[A-Za-z]/)) {
        continue;
      }
      
      // Skip if too long or too short
      if (part.length > 25 || part.length < 3) {
        continue;
      }
      
      // Skip common non-city indicators
      if (part.match(/^(USA|United States|State|Province|County|Region)$/i)) {
        continue;
      }
      
      if (part.length >= 3 && part.length <= 25) {
        return part;
      }
    }
    
    // Fallback to weather data city name
    return weatherData.weather.cityName || 'Unknown Location';
  }
}
