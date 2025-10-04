import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface WeatherData {
  temperature: number;
  precipitation: number;
  wind: number;
  relative_humidity: number;
  altitude: number;
  air_pressure: number;
}

export interface WeatherCategorizationResponse {
  success: boolean;
  weather_category: string;
  input_data: WeatherData;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherMlService {
  private readonly ML_API_URL = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  /**
   * Categorize weather using ML model
   * @param weatherData Weather parameters for ML model
   * @returns Observable with weather category
   */
  categorizeWeather(weatherData: WeatherData): Observable<string> {
    return this.http.post<WeatherCategorizationResponse>(`${this.ML_API_URL}/categorize-weather`, weatherData)
      .pipe(
        map(response => response.weather_category),
        catchError(error => {
          console.warn('ML weather categorization failed:', error);
          return of(this.getFallbackCategory(weatherData));
        })
      );
  }

  /**
   * Convert OpenWeatherMap data to ML model format
   * @param owmData Data from OpenWeatherMap
   * @returns Weather data in ML model format
   */
  convertToMlFormat(owmData: any): WeatherData {
    // Extract precipitation from rain/snow data
    let precipitation = 0;
    if (owmData.rain && owmData.rain['1h']) {
      precipitation = owmData.rain['1h'];
    } else if (owmData.snow && owmData.snow['1h']) {
      precipitation = owmData.snow['1h'];
    }

    return {
      temperature: owmData.main.temp,
      precipitation: precipitation,
      wind: owmData.wind.speed,
      relative_humidity: owmData.main.humidity,
      altitude: 100, // Default altitude - could be enhanced with elevation API
      air_pressure: owmData.main.pressure
    };
  }

  /**
   * Translate ML categories to human-readable Romanian text
   * @param mlCategory Category from ML model
   * @returns Human readable description
   */
  translateCategory(mlCategory: string): string {
    const translations: { [key: string]: string } = {
      'heavy_rain': 'ploaie torențială',
      'light_rain': 'ploaie ușoară',
      'snow': 'ninsoare',
      'hot': 'foarte cald',
      'cold': 'foarte rece',
      'sunny': 'însorit'
    };

    return translations[mlCategory] || mlCategory;
  }

  /**
   * Format ML category for display (replace underscores with spaces)
   * @param mlCategory Category from ML model
   * @returns Formatted category for display
   */
  formatCategoryForDisplay(mlCategory: string): string {
    return mlCategory.replace(/_/g, ' ');
  }

  /**
   * Get icon for ML category
   * @param mlCategory Category from ML model
   * @returns Icon code for weather display
   */
  getCategoryIcon(mlCategory: string): string {
    const icons: { [key: string]: string } = {
      'heavy_rain': '10d',
      'light_rain': '09d',
      'snow': '13d',
      'hot': '01d',
      'cold': '02d',
      'sunny': '01d'
    };

    return icons[mlCategory] || '03d'; // default cloudy icon
  }

  /**
   * Fallback categorization when ML service is unavailable
   * @param weatherData Weather data
   * @returns Simple category based on basic rules
   */
  private getFallbackCategory(weatherData: WeatherData): string {
    if (weatherData.temperature <= 0 && weatherData.precipitation > 0.001) {
      return 'snow';
    } else if (weatherData.precipitation >= 0.03) {
      return 'heavy_rain';
    } else if (weatherData.precipitation >= 0.005) {
      return 'light_rain';
    } else if (weatherData.temperature >= 25) {
      return 'hot';
    } else if (weatherData.temperature < 5) {
      return 'cold';
    } else {
      return 'sunny';
    }
  }
}