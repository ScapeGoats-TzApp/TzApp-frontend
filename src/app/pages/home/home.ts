import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavigationComponent } from '../../components/navigation';
import { SearchAutocompleteComponent } from '../../components/search-autocomplete/search-autocomplete.component';
import { CalendarPickerComponent } from '../../components/calendar-picker/calendar-picker.component';
import { WeatherService, WeatherResponse, ForecastResponse, PlacePrediction } from '../../services/weather.service';
import { GeolocationService, GeolocationCoordinates, GeolocationError } from '../../services/geolocation.service';
import { StorageService, SavedLocation } from '../../services/storage.service';
import { OneCallService, NormalizedWeatherData } from '../../services/onecall.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavigationComponent, SearchAutocompleteComponent, CalendarPickerComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomePage implements OnInit {
  // Page management
  currentPage = signal(0); // 0: My Location, 1: Saved Location, 2: Search, 3: Historical
  totalPages = 4;
  
  // Weather data for different pages
  weatherData = signal<WeatherResponse | null>(null);
  forecastData = signal<ForecastResponse | null>(null);
  savedWeatherData = signal<WeatherResponse | null>(null);
  savedForecastData = signal<ForecastResponse | null>(null);
  searchWeatherData = signal<WeatherResponse | null>(null);
  searchForecastData = signal<ForecastResponse | null>(null);
  
  // Historical weather data (Page 3)
  historicalWeatherData = signal<NormalizedWeatherData | null>(null);
  historicalSelectedDate = signal<Date>(new Date());
  historicalLocation = signal<{ lat: number; lon: number; name: string } | null>(null);
  
  // UI state
  loading = signal(false);
  error = signal<string | null>(null);
  showSearchBar = signal(true);
  locationPermissionDenied = signal(false);
  isGeolocationSupported = signal(false);
  
  // Saved location
  savedLocation = signal<SavedLocation | null>(null);
  hasSavedLocation = signal(false);
  
  // Touch/swipe handling
  touchStartX = 0;
  touchStartY = 0;
  
  Math = Math; // Make Math available in the template

  constructor(
    private weatherService: WeatherService,
    private geolocationService: GeolocationService,
    private storageService: StorageService,
    private sanitizer: DomSanitizer,
    private oneCallService: OneCallService
  ) {}

  ngOnInit(): void {
    // Check if geolocation is supported
    this.geolocationService.isGeolocationSupported().subscribe(supported => {
      this.isGeolocationSupported.set(supported);
      if (supported) {
        this.loadCurrentLocation();
      } else {
        this.loadDefaultLocation();
      }
    });

    // Load saved location
    this.storageService.getSavedLocation().subscribe(savedLocation => {
      this.savedLocation.set(savedLocation);
      this.hasSavedLocation.set(savedLocation !== null);
      if (savedLocation) {
        this.savedWeatherData.set(savedLocation.weatherData);
        // Load forecast for saved location
        this.loadSavedLocationForecast(savedLocation.weatherData.location.lat, savedLocation.weatherData.location.lng);
      }
    });
  }

  loadCurrentLocation(): void {
    this.loading.set(true);
    this.error.set(null);
    this.locationPermissionDenied.set(false);

    this.geolocationService.getCurrentPosition().subscribe({
      next: (coordinates) => {
        this.loadWeatherFromCoordinates(coordinates.latitude, coordinates.longitude);
      },
      error: (error: GeolocationError) => {
        console.warn('GPS location error:', error.message);
        this.locationPermissionDenied.set(error.code === 1);
        this.loadDefaultLocation();
      }
    });
  }

  loadWeatherFromCoordinates(lat: number, lng: number): void {
    // Get weather data from coordinates
    this.weatherService.getWeatherDataFromCoordinates(lat, lng).subscribe({
      next: (data) => {
        this.weatherData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to fetch weather data');
        this.loading.set(false);
      }
    });

    // Get forecast data from coordinates
    this.weatherService.getForecastDataFromCoordinates(lat, lng).subscribe({
      next: (data) => {
        this.forecastData.set(data);
      },
      error: (err) => {
        console.warn('Failed to fetch forecast data:', err.message);
      }
    });
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

  retryLocationAccess(): void {
    this.loadCurrentLocation();
  }

  // Navigation methods
  goToPage(pageIndex: number): void {
    if (pageIndex >= 0 && pageIndex < this.totalPages) {
      this.currentPage.set(pageIndex);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages - 1) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  // Touch/swipe handling
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - go to previous page
        this.previousPage();
      } else {
        // Swipe left - go to next page
        this.nextPage();
      }
    }
  }

  // Saved location methods
  saveCurrentLocation(): void {
    const currentWeather = this.weatherData();
    if (currentWeather) {
      this.storageService.saveLocation(currentWeather);
    }
  }

  saveSearchLocation(): void {
    const searchWeather = this.searchWeatherData();
    if (searchWeather) {
      this.storageService.saveLocation(searchWeather);
    }
  }

  removeSavedLocation(): void {
    this.storageService.removeSavedLocation();
    this.savedWeatherData.set(null);
    this.savedForecastData.set(null);
  }

  private loadSavedLocationForecast(lat: number, lng: number): void {
    this.weatherService.getForecastDataFromCoordinates(lat, lng).subscribe({
      next: (data) => {
        this.savedForecastData.set(data);
      },
      error: (err) => {
        console.warn('Failed to fetch saved location forecast:', err.message);
      }
    });
  }

  onPlaceSelected(prediction: PlacePrediction): void {
    this.loading.set(true);
    this.error.set(null);
    this.searchWeatherData.set(null);
    this.searchForecastData.set(null);

    // Get both current weather and forecast data for searched location
    this.weatherService.getWeatherDataFromPlaceId(prediction.place_id).subscribe({
      next: (data) => {
        this.searchWeatherData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to fetch weather data');
        this.loading.set(false);
      }
    });

    this.weatherService.getForecastDataFromPlaceId(prediction.place_id).subscribe({
      next: (data) => {
        this.searchForecastData.set(data);
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
    
    // Check if it's a coordinate-based address (fallback from GPS)
    if (address.includes(',') && address.split(',').length === 2) {
      const parts = address.split(',');
      if (parts.every(part => !isNaN(parseFloat(part.trim())))) {
        // This is a coordinate-based address, use the city name from weather data
        return this.weatherData()!.weather.cityName.toUpperCase();
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
    if (this.weatherData()!.weather.cityName) {
      return this.weatherData()!.weather.cityName.toUpperCase();
    }
    
    // Final fallback to first part
    const mainLocation = addressParts[0];
    return mainLocation.toUpperCase();
  }

  getSavedLocationDisplayName(): string {
    const savedLocation = this.savedLocation();
    if (!savedLocation) {
      return 'NO LOCATION SAVED';
    }
    
    // Use the saved location name or extract from weather data
    if (savedLocation.name) {
      return savedLocation.name.toUpperCase();
    }
    
    // Fallback to weather data city name
    return savedLocation.weatherData.weather.cityName.toUpperCase();
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

  getWindyMapUrl(): SafeResourceUrl {
    if (!this.weatherData()) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('https://embed.windy.com/embed2.html?lat=44.318&lon=23.797&zoom=12&level=surface&overlay=rain&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=44.318&detailLon=23.797&metricWind=default&metricTemp=default&radarRange=-1');
    }
    
    const lat = this.weatherData()!.location.lat;
    const lng = this.weatherData()!.location.lng;
    const url = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lng}&zoom=12&level=surface&overlay=rain&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=${lat}&detailLon=${lng}&metricWind=default&metricTemp=default&radarRange=-1`;
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getSearchWindyMapUrl(): SafeResourceUrl {
    if (!this.searchWeatherData()) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('https://embed.windy.com/embed2.html?lat=44.318&lon=23.797&zoom=12&level=surface&overlay=rain&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=44.318&detailLon=23.797&metricWind=default&metricTemp=default&radarRange=-1');
    }
    
    const lat = this.searchWeatherData()!.location.lat;
    const lng = this.searchWeatherData()!.location.lng;
    const url = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lng}&zoom=12&level=surface&overlay=rain&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=${lat}&detailLon=${lng}&metricWind=default&metricTemp=default&radarRange=-1`;
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getSavedWindyMapUrl(): SafeResourceUrl {
    if (!this.savedWeatherData()) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('https://embed.windy.com/embed2.html?lat=44.318&lon=23.797&zoom=12&level=surface&overlay=rain&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=44.318&detailLon=23.797&metricWind=default&metricTemp=default&radarRange=-1');
    }
    
    const lat = this.savedWeatherData()!.location.lat;
    const lng = this.savedWeatherData()!.location.lng;
    const url = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lng}&zoom=12&level=surface&overlay=rain&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=${lat}&detailLon=${lng}&metricWind=default&metricTemp=default&radarRange=-1`;
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Historical weather methods (Page 3)
  onHistoricalDateSelected(date: Date): void {
    this.historicalSelectedDate.set(date);
    if (this.historicalLocation()) {
      this.loadHistoricalWeather();
    }
  }

  onHistoricalPlaceSelected(prediction: PlacePrediction): void {
    this.loading.set(true);
    this.error.set(null);

    // Get place details to extract coordinates
    this.weatherService.getWeatherDataFromPlaceId(prediction.place_id).subscribe({
      next: (data) => {
        this.historicalLocation.set({
          lat: data.location.lat,
          lon: data.location.lng,
          name: data.weather.cityName
        });
        this.loadHistoricalWeather();
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to fetch location data');
        this.loading.set(false);
      }
    });
  }

  private loadHistoricalWeather(): void {
    const location = this.historicalLocation();
    const date = this.historicalSelectedDate();

    if (!location) return;

    this.loading.set(true);
    this.error.set(null);

    this.oneCallService.getWeatherForDate(location.lat, location.lon, date).subscribe({
      next: (data) => {
        this.historicalWeatherData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to fetch weather data');
        this.loading.set(false);
      }
    });
  }

  getHistoricalLocationDisplayName(): string {
    if (!this.historicalLocation()) {
      return 'SELECT A LOCATION';
    }
    return this.historicalLocation()!.name.toUpperCase();
  }

  getHistoricalDateType(): string {
    const data = this.historicalWeatherData();
    if (!data) return '';
    return data.type.toUpperCase();
  }

  getHistoricalFormattedDate(): string {
    return this.historicalSelectedDate().toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getHistoricalWindyMapUrl(): SafeResourceUrl {
    if (!this.historicalLocation()) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('https://embed.windy.com/embed2.html?lat=44.318&lon=23.797&zoom=12&level=surface&overlay=rain&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=44.318&detailLon=23.797&metricWind=default&metricTemp=default&radarRange=-1');
    }
    
    const lat = this.historicalLocation()!.lat;
    const lng = this.historicalLocation()!.lon;
    const url = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lng}&zoom=12&level=surface&overlay=rain&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=${lat}&detailLon=${lng}&metricWind=default&metricTemp=default&radarRange=-1`;
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
