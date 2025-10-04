import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

declare var google: any;
declare var initGoogleMaps: () => void;

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private autocompleteService: any;
  private placesService: any;
  private isLoaded = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initializeGoogleMaps();
  }

  private initializeGoogleMaps(): void {
    // Set up the global callback
    (window as any).initGoogleMaps = () => {
      // Add a small delay to ensure all services are loaded
      setTimeout(() => {
        this.setupGoogleMapsServices();
      }, 100);
    };

    // Check if Google Maps is already loaded
    if (typeof google !== 'undefined' && google.maps) {
      // Add a small delay to ensure all services are loaded
      setTimeout(() => {
        this.setupGoogleMapsServices();
      }, 100);
    } else {
      // Wait for Google Maps to load via callback
      const checkGoogleMaps = () => {
        if (typeof google !== 'undefined' && google.maps) {
          // Add a small delay to ensure all services are loaded
          setTimeout(() => {
            this.setupGoogleMapsServices();
          }, 100);
        } else {
          setTimeout(checkGoogleMaps, 100);
        }
      };
      checkGoogleMaps();
    }
  }

  private setupGoogleMapsServices(): void {
    try {
      // Check if all required Google Maps services are available
      if (google.maps && 
          google.maps.places && 
          google.maps.places.AutocompleteService && 
          google.maps.places.PlacesService) {
        
        this.autocompleteService = new google.maps.places.AutocompleteService();
        this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
        
        this.isLoaded.next(true);
      } else {
        console.warn('Google Maps services not fully loaded yet');
        this.isLoaded.next(false);
      }
    } catch (error) {
      console.error('Error setting up Google Maps services:', error);
      this.isLoaded.next(false);
    }
  }

  getPlacePredictions(input: string): Observable<PlacePrediction[]> {
    return new Observable(observer => {
      if (!this.autocompleteService) {
        observer.next([]);
        observer.complete();
        return;
      }

      const request = {
        input: input,
        types: ['(cities)']
      };

      // Use the working legacy API
      this.autocompleteService.getPlacePredictions(request, (predictions: any[], status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          observer.next(predictions);
        } else {
          observer.next([]);
        }
        observer.complete();
      });
    });
  }

  getPlaceDetails(placeId: string): Observable<any> {
    return new Observable(observer => {
      if (!this.placesService) {
        observer.error('Places service not available');
        return;
      }

      const request = {
        placeId: placeId,
        fields: ['geometry', 'formatted_address']
      };

      // Use the working legacy API
      this.placesService.getDetails(request, (place: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          observer.next(place);
        } else {
          observer.error('Place details not found');
        }
        observer.complete();
      });
    });
  }

  isGoogleMapsLoaded(): Observable<boolean> {
    return this.isLoaded.asObservable();
  }

  reverseGeocode(lat: number, lng: number): Observable<any> {
    return new Observable(observer => {
      if (!this.placesService) {
        observer.error('Places service not available');
        return;
      }

      const geocoder = new google.maps.Geocoder();
      const latlng = new google.maps.LatLng(lat, lng);

      geocoder.geocode({ location: latlng }, (results: any[], status: any) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          observer.next(results[0]);
        } else {
          observer.error('Reverse geocoding failed');
        }
        observer.complete();
      });
    });
  }
}

