import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarPickerComponent } from '../calendar-picker/calendar-picker.component';
import { SearchAutocompleteComponent } from '../search-autocomplete/search-autocomplete.component';

@Component({
  selector: 'app-weather-detail',
  standalone: true,
  imports: [CommonModule, CalendarPickerComponent, SearchAutocompleteComponent],
  templateUrl: './weather-details.html',
  styleUrl: './weather-details.scss'
})
export class WeatherDetailComponent {
  @Input() locationName: string = 'CIOROGARLA';
  @Input() currentTemp: number = 2;
  @Input() condition: string = 'Sunny';
  @Input() highTemp: number = 4;
  @Input() lowTemp: number = -5;
  @Input() forecastDate: string = '37/Feb/2069 forecast';
  @Input() feelsLike: number = 19;
  @Input() actualTemp: number = 23;
  @Input() tempDiff: number = 4;
  @Input() elevation: number = 100;
  @Input() coordinates = { lat: '44°18\'47.6"N', lng: '23°47\'33.0"E' };
  @Input() sunrise: string = '19:31';
  @Input() sunset: string = '20:47';
  @Input() uvIndex = { value: 1, level: 'low' };
  @Input() visibility: number = 69;
  @Input() visibilityDesc: string = 'Perfectly clear view.';
  @Input() precipChance: number = 50;
  @Input() pressure: number = 1017;
  @Input() humidity: number = 67;
  @Input() dewPoint: number = 3;
  
  // Calendar picker properties
  selectedDate = signal(new Date());
  showCalendar = signal(false);
  
  // Search properties
  searchPlaceholder = 'Search for a city';
  searchDisabled = signal(false);
  
  @Input() hourlyForecast = [
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

  // Calendar event handlers
  onDateSelected(date: Date): void {
    this.selectedDate.set(date);
    console.log('Selected date:', date);
    // Here you can emit the date or handle the date selection logic
  }

  // Search event handlers
  onPlaceSelected(prediction: any): void {
    console.log('Selected place:', prediction);
    // Here you can handle the place selection logic
  }
}
