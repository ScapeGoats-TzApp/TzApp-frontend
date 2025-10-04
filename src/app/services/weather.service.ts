import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { GoogleMapsService } from './google-maps.service';
import { environment } from '../../environments/environment';

declare var google: any;

export interface Location {
  lat: number;
  lng: number;
  address: string; 
}

export interface WeatherData {
  // Basic weather info
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  feelsLike: number;
  icon: string;
  
  // Extended weather data
  tempMin: number;
  tempMax: number;
  visibility: number;
  cloudiness: number;
  windDirection: number;
  windGust?: number;
  
  // Atmospheric data
  seaLevelPressure?: number;
  groundLevelPressure?: number;
  
  // Weather conditions
  weatherId: number;
  weatherMain: string;
  
  // Time data
  timestamp: number;
  sunrise: number;
  sunset: number;
  
  // Location data
  country: string;
  cityName: string;
  timezone: number;
}

export interface ElevationData {
  elevation: number;
  lat: number;
  lng: number;
}

export interface WeatherResponse {
  location: Location;
  weather: WeatherData;
  elevation: ElevationData;
}

export interface ForecastData {
  date: string;
  dayOfWeek: string;
  temperature: {
    min: number;
    max: number;
    day: number;
    night: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
  };
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  cloudiness: number;
  precipitation: number;
  precipitationChance: number;
}

export interface ForecastResponse {
  location: Location;
  forecast: ForecastData[];
}

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly GOOGLE_API_KEY = environment.apiKeys.google;
  private readonly OPENWEATHER_API_KEY = environment.apiKeys.openweather;
  
  private readonly GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
  private readonly OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
  private readonly OPENWEATHER_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

  constructor(private http: HttpClient, private googleMapsService: GoogleMapsService) {}

  getWeatherData(cityName: string): Observable<WeatherResponse> {
    return this.getLocationFromCity(cityName).pipe(
      switchMap(location => {
        return forkJoin({
          weather: this.getWeatherFromLocation(location.lat, location.lng),
          elevation: this.getElevationFromLocation(location.lat, location.lng)
        }).pipe(
          map(({ weather, elevation }) => ({
            location,
            weather,
            elevation
          }))
        );
      })
    );
  }

  getWeatherDataFromPlaceId(placeId: string): Observable<WeatherResponse> {
    return this.getLocationFromPlaceId(placeId).pipe(
      switchMap(location => {
        return forkJoin({
          weather: this.getWeatherFromLocation(location.lat, location.lng),
          elevation: this.getElevationFromLocation(location.lat, location.lng)
        }).pipe(
          map(({ weather, elevation }) => ({
            location,
            weather,
            elevation
          }))
        );
      })
    );
  }

  getPlacePredictions(input: string): Observable<PlacePrediction[]> {
    return this.googleMapsService.getPlacePredictions(input);
  }

  getForecastData(cityName: string): Observable<ForecastResponse> {
    return this.getLocationFromCity(cityName).pipe(
      switchMap(location => {
        return this.getForecastFromLocation(location.lat, location.lng).pipe(
          map(forecast => ({
            location,
            forecast
          }))
        );
      })
    );
  }

  getForecastDataFromPlaceId(placeId: string): Observable<ForecastResponse> {
    return this.getLocationFromPlaceId(placeId).pipe(
      switchMap(location => {
        return this.getForecastFromLocation(location.lat, location.lng).pipe(
          map(forecast => ({
            location,
            forecast
          }))
        );
      })
    );
  }

  private getLocationFromCity(cityName: string): Observable<Location> {
    const url = `${this.GOOGLE_GEOCODING_URL}?address=${encodeURIComponent(cityName)}&key=${this.GOOGLE_API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.status === 'OK' && response.results.length > 0) {
          const result = response.results[0];
          return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            address: result.formatted_address
          };
        } else {
          throw new Error('Location not found');
        }
      })
    );
  }

  private getLocationFromPlaceId(placeId: string): Observable<Location> {
    return this.googleMapsService.getPlaceDetails(placeId).pipe(
      map((place: any) => ({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address
      }))
    );
  }

  private getWeatherFromLocation(lat: number, lng: number): Observable<WeatherData> {
    const url = `${this.OPENWEATHER_URL}?lat=${lat}&lon=${lng}&appid=${this.OPENWEATHER_API_KEY}&units=metric`;
    
    return this.http.get<any>(url).pipe(
      map(response => ({
        // Basic weather info
        temperature: Math.round(response.main.temp),
        description: response.weather[0].description,
        humidity: response.main.humidity,
        windSpeed: response.wind.speed,
        pressure: response.main.pressure,
        feelsLike: Math.round(response.main.feels_like),
        icon: response.weather[0].icon,
        
        // Extended weather data
        tempMin: Math.round(response.main.temp_min),
        tempMax: Math.round(response.main.temp_max),
        visibility: response.visibility ? Math.round(response.visibility / 1000) : 0, // Convert to km
        cloudiness: response.clouds.all,
        windDirection: response.wind.deg,
        windGust: response.wind.gust,
        
        // Atmospheric data
        seaLevelPressure: response.main.sea_level,
        groundLevelPressure: response.main.grnd_level,
        
        // Weather conditions
        weatherId: response.weather[0].id,
        weatherMain: response.weather[0].main,
        
        // Time data
        timestamp: response.dt,
        sunrise: response.sys.sunrise,
        sunset: response.sys.sunset,
        
        // Location data
        country: response.sys.country,
        cityName: response.name,
        timezone: response.timezone
      }))
    );
  }

  private getForecastFromLocation(lat: number, lng: number): Observable<ForecastData[]> {
    const url = `${this.OPENWEATHER_FORECAST_URL}?lat=${lat}&lon=${lng}&appid=${this.OPENWEATHER_API_KEY}&units=metric`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        // Group forecast data by date and get daily summaries
        const dailyForecasts = new Map<string, any[]>();
        
        response.list.forEach((item: any) => {
          const date = new Date(item.dt * 1000).toDateString();
          if (!dailyForecasts.has(date)) {
            dailyForecasts.set(date, []);
          }
          dailyForecasts.get(date)!.push(item);
        });

        // Convert to ForecastData array
        const forecastData: ForecastData[] = [];
        const sortedDates = Array.from(dailyForecasts.keys()).sort();
        
        sortedDates.slice(0, 5).forEach(date => {
          const dayData = dailyForecasts.get(date)!;
          const dayForecast = this.processDailyForecast(dayData, date);
          forecastData.push(dayForecast);
        });

        return forecastData;
      })
    );
  }

  private processDailyForecast(dayData: any[], date: string): ForecastData {
    // Find the day's main forecast (usually around 12:00 PM)
    const mainForecast = dayData.find(item => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 12 && hour <= 15;
    }) || dayData[Math.floor(dayData.length / 2)];

    // Calculate min/max temperatures
    const temps = dayData.map(item => item.main.temp);
    const minTemp = Math.round(Math.min(...temps));
    const maxTemp = Math.round(Math.max(...temps));

    // Get day and night temperatures
    const dayTemp = Math.round(mainForecast.main.temp);
    const nightForecast = dayData.find(item => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 21 || hour <= 6;
    }) || dayData[dayData.length - 1];
    const nightTemp = Math.round(nightForecast.main.temp);

    // Calculate average values for the day
    const avgHumidity = Math.round(dayData.reduce((sum, item) => sum + item.main.humidity, 0) / dayData.length);
    const avgWindSpeed = Math.round((dayData.reduce((sum, item) => sum + item.wind.speed, 0) / dayData.length) * 10) / 10;
    const avgPressure = Math.round(dayData.reduce((sum, item) => sum + item.main.pressure, 0) / dayData.length);
    const avgCloudiness = Math.round(dayData.reduce((sum, item) => sum + item.clouds.all, 0) / dayData.length);
    
    // Get precipitation (rain volume for the day) and calculate precipitation chance
    const totalPrecipitation = dayData.reduce((sum, item) => {
      return sum + (item.rain ? (item.rain['3h'] || 0) : 0);
    }, 0);

    // Calculate precipitation chance (percentage of forecast periods with precipitation)
    const precipitationChance = Math.round((dayData.filter(item => 
      (item.rain && item.rain['3h'] > 0) || (item.pop && item.pop > 0)
    ).length / dayData.length) * 100);

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

    return {
      date,
      dayOfWeek,
      temperature: {
        min: minTemp,
        max: maxTemp,
        day: dayTemp,
        night: nightTemp
      },
      weather: {
        main: mainForecast.weather[0].main,
        description: mainForecast.weather[0].description,
        icon: mainForecast.weather[0].icon
      },
      humidity: avgHumidity,
      windSpeed: avgWindSpeed,
      windDirection: mainForecast.wind.deg,
      pressure: avgPressure,
      cloudiness: avgCloudiness,
      precipitation: Math.round(totalPrecipitation * 10) / 10,
      precipitationChance
    };
  }

  private getElevationFromLocation(lat: number, lng: number): Observable<ElevationData> {
    return new Observable(observer => {
      if (typeof google === 'undefined' || !google.maps || !google.maps.ElevationService) {
        // Return default elevation if Google Maps ElevationService is not available
        observer.next({
          elevation: 0,
          lat: lat,
          lng: lng
        });
        observer.complete();
        return;
      }

      try {
        const elevator = new google.maps.ElevationService();
        const request = {
          locations: [{ lat: lat, lng: lng }]
        };

        elevator.getElevationForLocations(request, (results: any[], status: any) => {
          if (status === google.maps.ElevationStatus.OK && results && results.length > 0) {
            observer.next({
              elevation: Math.round(results[0].elevation),
              lat: results[0].location.lat(),
              lng: results[0].location.lng()
            });
          } else {
            // Return default elevation if elevation data is not available
            observer.next({
              elevation: 0,
              lat: lat,
              lng: lng
            });
          }
          observer.complete();
        });
      } catch (error) {
        // Return default elevation if there's an error
        observer.next({
          elevation: 0,
          lat: lat,
          lng: lng
        });
        observer.complete();
      }
    });
  }
}

