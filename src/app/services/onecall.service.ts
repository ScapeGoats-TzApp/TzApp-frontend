import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { WeatherService, WeatherResponse } from './weather.service';

// Response interfaces for OneCall API 3.0

// Daily Summary Response (past and future dates)
export interface DailySummaryResponse {
  lat: number;
  lon: number;
  tz: string;
  date: string;
  units: string;
  cloud_cover: {
    afternoon: number;
  };
  humidity: {
    afternoon: number;
  };
  precipitation: {
    total: number;
  };
  temperature: {
    min: number;
    max: number;
    afternoon: number;
    night: number;
    evening: number;
    morning: number;
  };
  pressure: {
    afternoon: number;
  };
  wind: {
    max: {
      speed: number;
      direction: number;
    };
  };
}

// Current Weather Response (OneCall endpoint)
export interface CurrentWeatherResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    rain?: {
      '1h': number;
    };
  };
  minutely?: Array<{
    dt: number;
    precipitation: number;
  }>;
  hourly?: Array<any>;
  daily?: Array<any>;
}

// Normalized interface for unified display (mutual data across all endpoints)
export interface NormalizedWeatherData {
  date: string;
  dateObj: Date;
  temperature: {
    min: number;
    max: number;
    afternoon?: number;
    morning?: number;
    evening?: number;
    night?: number;
    current?: number;
    feels_like?: number;
  };
  humidity: number;
  pressure: number;
  cloudiness: number;
  precipitation?: number;
  wind: {
    speed: number;
    direction?: number;
  };
  type: 'past' | 'present' | 'future';
  location: {
    lat: number;
    lon: number;
  };
  weather?: {
    description: string;
    icon: string;
    main: string;
  };
  uvi?: number;
  visibility?: number;
  elevation?: {
    elevation: number;
    lat: number;
    lng: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OneCallService {
  private readonly API_KEY = environment.apiKeys.openweather;
  private readonly BASE_URL = 'https://api.openweathermap.org/data/3.0/onecall';

  constructor(
    private http: HttpClient,
    private weatherService: WeatherService
  ) {}

  /**
   * Get weather data for a specific date (past, present, or future)
   * @param lat Latitude
   * @param lon Longitude
   * @param date Date object
   * @returns Observable of normalized weather data
   */
  getWeatherForDate(lat: number, lon: number, date: Date): Observable<NormalizedWeatherData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Present day (use existing weather service)
    if (diffDays === 0) {
      return this.weatherService.getWeatherDataFromCoordinates(lat, lon).pipe(
        map(response => this.normalizeWeatherResponse(response, date))
      );
    }
    // Past or future (use day summary endpoint)
    else {
      return this.getDaySummary(lat, lon, date).pipe(
        map(response => this.normalizeDailySummary(response, date, diffDays < 0 ? 'past' : 'future'))
      );
    }
  }

  /**
   * Get daily summary for a specific date (past or future)
   */
  private getDaySummary(lat: number, lon: number, date: Date): Observable<DailySummaryResponse> {
    const dateStr = this.formatDateForApi(date);
    const timezone = this.getTimezoneOffset(date);
    
    const url = `${this.BASE_URL}/day_summary`;
    const params = {
      lat: lat.toString(),
      lon: lon.toString(),
      date: dateStr,
      tz: timezone,
      units: 'metric',
      appid: this.API_KEY
    };

    return this.http.get<DailySummaryResponse>(url, { params }).pipe(
      catchError(this.handleError)
    );
  }


  /**
   * Normalize daily summary data to common format
   */
  private normalizeDailySummary(
    data: DailySummaryResponse, 
    date: Date, 
    type: 'past' | 'future'
  ): NormalizedWeatherData {
    return {
      date: data.date,
      dateObj: date,
      temperature: {
        min: data.temperature.min,
        max: data.temperature.max,
        afternoon: data.temperature.afternoon,
        morning: data.temperature.morning,
        evening: data.temperature.evening,
        night: data.temperature.night
      },
      humidity: data.humidity.afternoon,
      pressure: data.pressure.afternoon,
      cloudiness: data.cloud_cover.afternoon,
      precipitation: data.precipitation.total,
      wind: {
        speed: data.wind.max.speed,
        direction: data.wind.max.direction
      },
      type,
      location: {
        lat: data.lat,
        lon: data.lon
      }
    };
  }

  /**
   * Normalize weather service response to common format
   */
  private normalizeWeatherResponse(data: WeatherResponse, date: Date): NormalizedWeatherData {
    return {
      date: this.formatDateForApi(date),
      dateObj: date,
      temperature: {
        min: data.weather.tempMin,
        max: data.weather.tempMax,
        current: data.weather.temperature,
        feels_like: data.weather.feelsLike
      },
      humidity: data.weather.humidity,
      pressure: data.weather.pressure,
      cloudiness: data.weather.cloudiness,
      wind: {
        speed: data.weather.windSpeed,
        direction: data.weather.windDirection
      },
      type: 'present',
      location: {
        lat: data.location.lat,
        lon: data.location.lng
      },
      weather: {
        description: data.weather.description,
        icon: data.weather.icon,
        main: data.weather.weatherMain
      },
      visibility: data.weather.visibility,
      elevation: data.elevation
    };
  }

  /**
   * Format date for API (YYYY-MM-DD)
   */
  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get timezone offset in format +HH:MM or -HH:MM
   */
  private getTimezoneOffset(date: Date): string {
    const offset = -date.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while fetching weather data';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

