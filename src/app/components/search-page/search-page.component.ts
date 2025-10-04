import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarPickerComponent } from '../calendar-picker/calendar-picker.component';
import { WeatherService, WeatherResponse, ForecastResponse, PlacePrediction } from '../../services/weather.service';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, CalendarPickerComponent],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss'
})
export class SearchPageComponent {
  @Input() searchWeatherData = signal<WeatherResponse | null>(null);
  @Input() searchForecastData = signal<ForecastResponse | null>(null);
  @Input() loading = signal(false);
  @Input() error = signal<string | null>(null);
  @Input() selectedDate = signal(new Date());
  @Input() hasSavedLocation = signal(false);
  
  @Output() placeSelected = new EventEmitter<PlacePrediction>();
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() saveSearchLocation = new EventEmitter<void>();
  
  Math = Math; // Make Math available in the template

  constructor(private weatherService: WeatherService) {}

  onPlaceSelected(prediction: PlacePrediction): void {
    this.placeSelected.emit(prediction);
  }

  onDateSelected(date: Date): void {
    this.dateSelected.emit(date);
  }

  onSaveLocation(): void {
    this.saveSearchLocation.emit();
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

  getSearchLocationDisplayName(): string {
    if (!this.searchWeatherData()) {
      return 'SEARCH FOR A CITY';
    }
    
    // Extract the main location name from Google Maps formatted address
    const address = this.searchWeatherData()!.location.address;
    
    // Check if it's a coordinate-based address (fallback from GPS)
    if (address.includes(',') && address.split(',').length === 2) {
      const parts = address.split(',');
      if (parts.every(part => !isNaN(parseFloat(part.trim())))) {
        // This is a coordinate-based address, use the city name from weather data
        return this.searchWeatherData()!.weather.cityName.toUpperCase();
      }
    }
    
    // For Google Maps formatted addresses, try to extract the most relevant location name
    const addressParts = address.split(',').map(part => part.trim());
    
    // Look for the best city/neighborhood name, avoiding postal codes and numbers
    for (let i = 0; i < Math.min(4, addressParts.length); i++) {
      const part = addressParts[i];
      
      // Skip if it's a postal code (numbers only or starts with numbers)
      if (part.match(/^\d+/) || part.match(/^\d+[A-Za-z]/)) {
        continue;
      }
      
      // Skip if it's too long (likely a full address or country)
      if (part.length > 25) {
        continue;
      }
      
      // Skip if it's too short (likely an abbreviation)
      if (part.length < 3) {
        continue;
      }
      
      // Skip common non-city indicators
      if (part.match(/^(USA|United States|State|Province|County|Region)$/i)) {
        continue;
      }
      
      // This looks like a good city/neighborhood name
      if (part.length >= 3 && part.length <= 25) {
        return part.toUpperCase();
      }
    }
    
    // Fallback to weather data city name if available
    if (this.searchWeatherData()!.weather.cityName) {
      return this.searchWeatherData()!.weather.cityName.toUpperCase();
    }
    
    // Final fallback to first part
    const mainLocation = addressParts[0];
    return mainLocation.toUpperCase();
  }

  getFormattedDate(): string {
    const date = this.selectedDate();
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}/${month}/${year} forecast`;
  }

  getHourlyForecast(): any[] {
    // Return mock hourly forecast data for now
    // In a real implementation, this would come from the weather service
    return [
      { time: 'Now', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60', temp: 19 },
      { time: '12', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60', temp: 19 },
      { time: '13', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60', temp: 19 },
      { time: '14', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60', temp: 19 },
      { time: '15', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60', temp: 19 },
      { time: '16', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60', temp: 19 },
      { time: '17', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60', temp: 19 },
      { time: '18', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60', temp: 19 },
      { time: '19', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60', temp: 19 },
      { time: '20', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/6bd058e86a0b82880e5e337cfd6a01e6ce0fd7d4?width=60', temp: 19 },
      { time: '21', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/a960056644eb5e819019fd74598e8fd5a76b71cf?width=60', temp: 19 },
      { time: '22', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/ad33659c33381eac40061641b81f19d65a13ad9f?width=60', temp: 19 },
      { time: '23', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/ad33659c33381eac40061641b81f19d65a13ad9f?width=60', temp: 19 },
      { time: '00', icon: 'https://api.builder.io/api/v1/image/assets/TEMP/ad33659c33381eac40061641b81f19d65a13ad9f?width=60', temp: 19 },
    ];
  }
}
