import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private currentPosition = new BehaviorSubject<GeolocationCoordinates | null>(null);
  private isSupported = new BehaviorSubject<boolean>(false);

  constructor() {
    this.checkGeolocationSupport();
  }

  private checkGeolocationSupport(): void {
    this.isSupported.next('geolocation' in navigator);
  }

  isGeolocationSupported(): Observable<boolean> {
    return this.isSupported.asObservable();
  }

  getCurrentPosition(): Observable<GeolocationCoordinates> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error({
          code: 0,
          message: 'Geolocation is not supported by this browser'
        });
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: GeolocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          this.currentPosition.next(coordinates);
          observer.next(coordinates);
          observer.complete();
        },
        (error) => {
          const geolocationError: GeolocationError = {
            code: error.code,
            message: this.getErrorMessage(error.code)
          };
          observer.error(geolocationError);
        },
        options
      );
    });
  }

  watchPosition(): Observable<GeolocationCoordinates> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error({
          code: 0,
          message: 'Geolocation is not supported by this browser'
        });
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute
      };

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coordinates: GeolocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          this.currentPosition.next(coordinates);
          observer.next(coordinates);
        },
        (error) => {
          const geolocationError: GeolocationError = {
            code: error.code,
            message: this.getErrorMessage(error.code)
          };
          observer.error(geolocationError);
        },
        options
      );

      // Return cleanup function
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  getLastKnownPosition(): Observable<GeolocationCoordinates | null> {
    return this.currentPosition.asObservable();
  }

  private getErrorMessage(errorCode: number): string {
    switch (errorCode) {
      case 1:
        return 'Permission denied. Please allow location access to see your current location.';
      case 2:
        return 'Location unavailable. Please check your internet connection and try again.';
      case 3:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while getting your location.';
    }
  }

  requestPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(false);
        return;
      }

      // Try to get current position to trigger permission request
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          if (error.code === 1) {
            resolve(false); // Permission denied
          } else {
            resolve(true); // Permission granted but other error
          }
        },
        { timeout: 1000 }
      );
    });
  }
}
