import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationComponent } from '../../components/navigation';
import { SearchAutocompleteComponent } from '../../components/search-autocomplete/search-autocomplete.component';
import { WeatherService, PlacePrediction } from '../../services/weather.service';
import { GoogleMapsService } from '../../services/google-maps.service';
import { OneCallService, DailySummaryResponse } from '../../services/onecall.service';

// Event criteria interface
interface EventCriteria {
  temp_range: [number, number];
  max_precip: number;
  max_wind: number;
  max_humidity: number;
  max_clouds: number;
}

// Day score interface
interface DayScore {
  date: Date;
  dateStr: string;
  score: number;
  temp: number;
  precip: number;
  wind: number;
  humidity: number;
  clouds: number;
}

@Component({
  selector: 'app-smart-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, NavigationComponent, SearchAutocompleteComponent],
  templateUrl: './smart-planner.html',
  styleUrl: './smart-planner.scss'
})
export class SmartPlanner implements OnInit {
  // Event criteria definitions
  private readonly EVENT_CRITERIA: Record<string, EventCriteria> = {
    'picnic': {
      temp_range: [18, 26],
      max_precip: 0.5,
      max_wind: 4.0,
      max_humidity: 70,
      max_clouds: 60
    },
    'festival': {
      temp_range: [15, 28],
      max_precip: 1.0,
      max_wind: 6.0,
      max_humidity: 75,
      max_clouds: 80
    },
    'pool_party': {
      temp_range: [22, 32],
      max_precip: 0.0,
      max_wind: 3.0,
      max_humidity: 65,
      max_clouds: 40
    },
    'concert': {
      temp_range: [12, 25],
      max_precip: 0.2,
      max_wind: 5.0,
      max_humidity: 80,
      max_clouds: 70
    },
    'drumetie': {
      temp_range: [8, 22],
      max_precip: 0.1,
      max_wind: 7.0,
      max_humidity: 80,
      max_clouds: 70
    },
    'nunta': {
      temp_range: [16, 26],
      max_precip: 0.0,
      max_wind: 3.0,
      max_humidity: 65,
      max_clouds: 30
    },
    'zi_nastere': {
      temp_range: [15, 27],
      max_precip: 0.3,
      max_wind: 4.0,
      max_humidity: 75,
      max_clouds: 60
    }
  };

  // Event types for display
  readonly eventTypes = [
    { id: 'picnic', label: 'picnic' },
    { id: 'festival', label: 'festival' },
    { id: 'pool_party', label: 'pool party' },
    { id: 'concert', label: 'concert' },
    { id: 'drumetie', label: 'drumetie' },
    { id: 'nunta', label: 'nunta' },
    { id: 'zi_nastere', label: 'zi nastere' }
  ];

  // Component state
  searchQuery = signal('');
  selectedEvent = signal<string | null>(null);
  selectedLocation = signal<{ lat: number, lon: number, address: string } | null>(null);
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  monthInput = signal('');

  loading = signal(false);
  topDays = signal<DayScore[]>([]);
  showResults = signal(false);
  errorMessage = signal<string | null>(null);

  // Calendar state
  currentMonth = signal(new Date());
  calendarDays = signal<Date[]>([]);
  showCalendarPopup = signal(false);
  selectedDate = signal<Date | null>(null);
  currentYear = signal(new Date().getFullYear());

  constructor(
    private weatherService: WeatherService,
    private googleMapsService: GoogleMapsService,
    private oneCallService: OneCallService
  ) {}

  ngOnInit(): void {
    this.updateCalendar();
    // Set default month input
    const now = new Date();
    this.monthInput.set(`${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`);
  }

  // Event selection
  selectEvent(eventId: string): void {
    this.selectedEvent.set(eventId);
  }

  // Filter events based on search
  get filteredEvents() {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.eventTypes;
    return this.eventTypes.filter(event => 
      event.label.toLowerCase().includes(query)
    );
  }

  // Handle place selection
  onPlaceSelected(prediction: PlacePrediction): void {
    this.googleMapsService.getPlaceDetails(prediction.place_id).subscribe({
      next: (place: any) => {
        this.selectedLocation.set({
          lat: place.geometry.location.lat(),
          lon: place.geometry.location.lng(),
          address: place.formatted_address
        });
      },
      error: (error) => {
        console.error('Error getting place details:', error);
        this.errorMessage.set('Error loading location details');
      }
    });
  }

  // Handle month input
  onMonthInputChange(): void {
    const value = this.monthInput();
    const match = value.match(/^(\d{1,2})\/(\d{4})$/);
    
    if (match) {
      const month = parseInt(match[1], 10);
      const year = parseInt(match[2], 10);
      
      if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        this.selectedMonth.set(month);
        this.selectedYear.set(year);
        this.currentMonth.set(new Date(year, month - 1, 1));
        this.updateCalendar();
      }
    }
  }

  // Start analysis
  startLookin(): void {
    const event = this.selectedEvent();
    const location = this.selectedLocation();
    const month = this.selectedMonth();
    const year = this.selectedYear();

    if (!event || !location) {
      this.errorMessage.set('Please select an event and location');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.showResults.set(false);

    this.oneCallService.getMonthData(location.lat, location.lon, month, year).subscribe({
      next: (data) => {
        const scores = this.calculateBestDays(data, event);
        this.topDays.set(scores);
        this.showResults.set(true);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error fetching weather data:', error);
        this.errorMessage.set('Error fetching weather data. Please try again.');
        this.loading.set(false);
      }
    });
  }

  // Calculate best days using the scoring algorithm
  private calculateBestDays(monthData: DailySummaryResponse[], eventType: string): DayScore[] {
    const criteria = this.EVENT_CRITERIA[eventType];
    const scores: DayScore[] = [];

    console.log(`\n=== Scoring days for ${eventType} event ===`);
    
    monthData.forEach((day) => {
      const score = this.calculateEventScore(day, criteria);
      const date = new Date(day.date);
      
      // Log each day's score with details
      console.log(`${day.date}: Score = ${score.toFixed(2)} | Temp: ${(day.temperature.afternoon).toFixed(1)}°C | Precip: ${day.precipitation.total}mm | Wind: ${day.wind.max.speed}m/s | Humidity: ${day.humidity.afternoon}% | Clouds: ${day.cloud_cover.afternoon}%`);
      
      scores.push({
        date,
        dateStr: day.date,
        score,
        temp: day.temperature.afternoon,
        precip: day.precipitation.total,
        wind: day.wind.max.speed,
        humidity: day.humidity.afternoon,
        clouds: day.cloud_cover.afternoon
      });
    });

    // Sort by score descending and return top 5
    const topDays = scores.sort((a, b) => b.score - a.score).slice(0, 5);
    
    console.log(`\n=== Top 5 days for ${eventType} ===`);
    topDays.forEach((day, index) => {
      console.log(`${index + 1}. ${day.dateStr}: Score = ${day.score.toFixed(2)}`);
    });
    
    return topDays;
  }

  // Score calculation algorithm (TypeScript version of Python code)
  private calculateEventScore(row: DailySummaryResponse, criteria: EventCriteria): number {
    let score = 0;

    // Temperature is in Kelvin from API (standard units), convert to Celsius
    const tempC = row.temperature.afternoon;
    
    // Temperature score (0-30 points)
    const [tempMin, tempMax] = criteria.temp_range;
    if (tempC >= tempMin && tempC <= tempMax) {
      score += 30;
    } else {
      const tempPenalty = Math.min(Math.abs(tempC - tempMin), Math.abs(tempC - tempMax));
      score += Math.max(0, 30 - tempPenalty * 2);
    }
    
    // Precipitation score (0-25 points)
    const precip = row.precipitation.total;
    if (precip <= criteria.max_precip) {
      score += 25;
    } else {
      score += Math.max(0, 25 - (precip - criteria.max_precip) * 10);
    }
    
    // Wind score (0-20 points)
    const windSpeed = row.wind.max.speed;
    if (windSpeed <= criteria.max_wind) {
      score += 20;
    } else {
      score += Math.max(0, 20 - (windSpeed - criteria.max_wind) * 3);
    }
    
    // Humidity score (0-15 points)
    const humidity = row.humidity.afternoon;
    if (humidity <= criteria.max_humidity) {
      score += 15;
    } else {
      score += Math.max(0, 15 - (humidity - criteria.max_humidity) * 0.3);
    }
    
    // Cloud cover score (0-10 points)
    const clouds = row.cloud_cover.afternoon;
    if (clouds <= criteria.max_clouds) {
      score += 10;
    } else {
      score += Math.max(0, 10 - (clouds - criteria.max_clouds) * 0.2);
    }
    
    return Math.round(score * 100) / 100;
  }

  // Calendar methods
  updateCalendar(): void {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(new Date(year, month, -startingDayOfWeek + i + 1));
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    this.calendarDays.set(days);
  }

  getMonthName(): string {
    return this.currentMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  previousMonth(): void {
    const current = this.currentMonth();
    const newMonth = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.currentMonth.set(newMonth);
    this.selectedMonth.set(newMonth.getMonth() + 1);
    this.selectedYear.set(newMonth.getFullYear());
    this.monthInput.set(`${String(newMonth.getMonth() + 1).padStart(2, '0')}/${newMonth.getFullYear()}`);
    this.updateCalendar();
  }

  nextMonth(): void {
    const current = this.currentMonth();
    const newMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.currentMonth.set(newMonth);
    this.selectedMonth.set(newMonth.getMonth() + 1);
    this.selectedYear.set(newMonth.getFullYear());
    this.monthInput.set(`${String(newMonth.getMonth() + 1).padStart(2, '0')}/${newMonth.getFullYear()}`);
    this.updateCalendar();
  }

  isCurrentMonth(date: Date): boolean {
    const current = this.currentMonth();
    return date.getMonth() === current.getMonth() &&
           date.getFullYear() === current.getFullYear();
  }

  isTopDay(date: Date): boolean {
    const dateStr = this.formatDate(date);
    return this.topDays().some(day => day.dateStr === dateStr);
  }

  getDayRank(date: Date): number {
    const dateStr = this.formatDate(date);
    const index = this.topDays().findIndex(day => day.dateStr === dateStr);
    return index >= 0 ? index + 1 : 0;
  }

  getDayScore(date: Date): DayScore | null {
    const dateStr = this.formatDate(date);
    return this.topDays().find(day => day.dateStr === dateStr) || null;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Calendar popup methods
  toggleCalendar(): void {
    this.showCalendarPopup.set(!this.showCalendarPopup());
  }

  // Year navigation
  previousYear(): void {
    const currentYear = new Date().getFullYear();
    if (this.currentYear() > currentYear) {
      this.currentYear.set(this.currentYear() - 1);
    }
  }

  nextYear(): void {
    const currentDate = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 18);
    const maxFutureYear = maxFutureDate.getFullYear();
    
    if (this.currentYear() < maxFutureYear) {
      this.currentYear.set(this.currentYear() + 1);
    }
  }

  // Navigation helper methods
  canGoToPreviousYear(): boolean {
    const currentYear = new Date().getFullYear();
    return this.currentYear() > currentYear;
  }

  canGoToNextYear(): boolean {
    const currentDate = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 18);
    const maxFutureYear = maxFutureDate.getFullYear();
    
    return this.currentYear() < maxFutureYear;
  }

  // Month selection
  selectMonth(month: number, year: number): void {
    this.selectedMonth.set(month);
    this.selectedYear.set(year);
    this.monthInput.set(`${String(month).padStart(2, '0')}/${year}`);
    this.currentMonth.set(new Date(year, month - 1, 1));
    this.updateCalendar();
    this.showCalendarPopup.set(false);
  }

  // Get months for current year with disabled state
  getMonthsForYear(): Array<{name: string, value: number, year: number, selected: boolean, disabled: boolean}> {
    const year = this.currentYear();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-based month
    
    // Calculate the maximum future month (1.5 years = 18 months)
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 18);
    const maxFutureYear = maxFutureDate.getFullYear();
    const maxFutureMonth = maxFutureDate.getMonth() + 1;
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return months.map((name, index) => {
      const monthValue = index + 1;
      const isCurrentYear = year === currentYear;
      const isPastMonth = isCurrentYear && monthValue < currentMonth;
      const isTooFarFuture = year > maxFutureYear || (year === maxFutureYear && monthValue > maxFutureMonth);
      const isSelected = monthValue === this.selectedMonth() && year === this.selectedYear();
      
      return {
        name,
        value: monthValue,
        year,
        selected: isSelected,
        disabled: isPastMonth || isTooFarFuture
      };
    });
  }
}
