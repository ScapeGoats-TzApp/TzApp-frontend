import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavigationComponent } from '../../components/navigation';
import { SearchAutocompleteComponent } from '../../components/search-autocomplete/search-autocomplete.component';
import { WeatherService, WeatherResponse, ForecastResponse, PlacePrediction } from '../../services/weather.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavigationComponent, SearchAutocompleteComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomePage implements OnInit {
  weatherData = signal<WeatherResponse | null>(null);
  forecastData = signal<ForecastResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  showSearchBar = signal(true);
  Math = Math; // Make Math available in the template

  constructor(
    private weatherService: WeatherService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Load default location (Bucharest) on page load
    this.loadDefaultLocation();
  }

  loadDefaultLocation(): void {
    this.loading.set(true);
    this.error.set(null);

    // Get weather data for Bucharest
    this.weatherService.getWeatherData('Bucharest, Romania').subscribe({
      next: (data) => {
        this.weatherData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to fetch weather data');
        this.loading.set(false);
      }
    });

    // Get forecast data for Bucharest
    this.weatherService.getForecastData('Bucharest, Romania').subscribe({
      next: (data) => {
        this.forecastData.set(data);
      },
      error: (err) => {
        console.warn('Failed to fetch forecast data:', err.message);
      }
    });
  }

  onPlaceSelected(prediction: PlacePrediction): void {
    this.loading.set(true);
    this.error.set(null);
    this.weatherData.set(null);
    this.forecastData.set(null);

    // Get both current weather and forecast data
    this.weatherService.getWeatherDataFromPlaceId(prediction.place_id).subscribe({
      next: (data) => {
        this.weatherData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to fetch weather data');
        this.loading.set(false);
      }
    });

    this.weatherService.getForecastDataFromPlaceId(prediction.place_id).subscribe({
      next: (data) => {
        this.forecastData.set(data);
      },
      error: (err) => {
        console.warn('Failed to fetch forecast data:', err.message);
      }
    });
  }

  getWeatherIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatCoordinates(lat: number, lng: number): { lat: string; lng: string } {
    const formatDMS = (value: number, isLat: boolean) => {
      const absolute = Math.abs(value);
      const degrees = Math.floor(absolute);
      const minutesDecimal = (absolute - degrees) * 60;
      const minutes = Math.floor(minutesDecimal);
      const seconds = ((minutesDecimal - minutes) * 60).toFixed(1);
      const direction = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
      return `${degrees}°${minutes}'${seconds}"${direction}`;
    };

    return {
      lat: formatDMS(lat, true),
      lng: formatDMS(lng, false)
    };
  }

  getDayLabel(index: number): string {
    if (index === 0) return 'Today';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date();
    date.setDate(date.getDate() + index);
    return days[date.getDay()];
  }

  getLocationDisplayName(): string {
    if (!this.weatherData()) {
      return 'BUCHAREST';
    }
    
    // Extract the main location name from Google Maps formatted address
    const address = this.weatherData()!.location.address;
    
    // Split by comma and get the first part (usually the city/location name)
    const addressParts = address.split(',');
    const mainLocation = addressParts[0].trim();
    
    // Convert to uppercase to match the design
    return mainLocation.toUpperCase();
  }

  getWindyMapUrl(): SafeResourceUrl {
    if (!this.weatherData()) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('https://embed.windy.com/embed2.html?lat=44.318&lon=23.797&zoom=12&level=surface&overlay=rain&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=44.318&detailLon=23.797&metricWind=default&metricTemp=default&radarRange=-1');
    }
    
    const lat = this.weatherData()!.location.lat;
    const lng = this.weatherData()!.location.lng;
    const url = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lng}&zoom=12&level=surface&overlay=rain&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=${lat}&detailLon=${lng}&metricWind=default&metricTemp=default&radarRange=-1`;
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
