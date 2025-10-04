import { Component, Input, Output, EventEmitter, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherService, PlacePrediction } from '../../services/weather.service';
import { GoogleMapsService } from '../../services/google-maps.service';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';

@Component({
  selector: 'app-calendar-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar-picker.component.html',
  styleUrl: './calendar-picker.component.scss'
})
export class CalendarPickerComponent implements OnInit, OnDestroy {
  @Input() selectedDate: Date = new Date();
  @Input() disabled: boolean = false;
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() placeSelected = new EventEmitter<PlacePrediction>();

  // Calendar properties
  isOpen = signal(false);
  currentMonth = signal(new Date());
  selectedDateSignal = signal(new Date());

  // Search properties
  inputValue = signal('');
  predictions = signal<PlacePrediction[]>([]);
  showSuggestions = signal(false);
  selectedIndex = signal(-1);
  loading = signal(false);
  googleMapsReady = signal(false);

  private inputSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private weatherService: WeatherService,
    private googleMapsService: GoogleMapsService
  ) {}

  ngOnInit(): void {
    this.selectedDateSignal.set(this.selectedDate);
    this.currentMonth.set(new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1));

    // Wait for Google Maps to load
    this.googleMapsService.isGoogleMapsLoaded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(ready => {
        this.googleMapsReady.set(ready);
      });

    // Set up debounced search
    this.inputSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(input => {
          if (!this.googleMapsReady() || !input || input.length < 2) {
            return new Observable<PlacePrediction[]>(observer => observer.next([]));
          }
          this.loading.set(true);
          return this.weatherService.getPlacePredictions(input);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (predictions: PlacePrediction[]) => {
          this.predictions.set(predictions);
          this.showSuggestions.set(predictions.length > 0);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCalendar(): void {
    if (!this.disabled) {
      this.isOpen.set(!this.isOpen());
    }
  }

  closeCalendar(): void {
    this.isOpen.set(false);
  }

  selectDate(date: Date): void {
    this.selectedDateSignal.set(date);
    this.dateSelected.emit(date);
    this.closeCalendar();
  }

  getDaysInMonth(): Date[] {
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

    return days;
  }

  getMonthName(): string {
    return this.currentMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  previousMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isSelected(date: Date): boolean {
    const selected = this.selectedDateSignal();
    return date.getDate() === selected.getDate() &&
           date.getMonth() === selected.getMonth() &&
           date.getFullYear() === selected.getFullYear();
  }

  isCurrentMonth(date: Date): boolean {
    const current = this.currentMonth();
    return date.getMonth() === current.getMonth() &&
           date.getFullYear() === current.getFullYear();
  }

  getDayNames(): string[] {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  formatSelectedDate(): string {
    const date = this.selectedDateSignal();
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Search methods
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.inputValue.set(value);
    
    if (value.length >= 2) {
      this.inputSubject.next(value);
    } else {
      this.predictions.set([]);
      this.showSuggestions.set(false);
    }
  }

  onInputFocus(): void {
    if (this.predictions().length > 0) {
      this.showSuggestions.set(true);
    }
  }

  onInputBlur(): void {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showSuggestions()) return;

    const predictions = this.predictions();
    const currentIndex = this.selectedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.set(Math.min(currentIndex + 1, predictions.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.set(Math.max(currentIndex - 1, -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < predictions.length) {
          this.selectPrediction(predictions[currentIndex]);
        }
        break;
      case 'Escape':
        this.showSuggestions.set(false);
        this.selectedIndex.set(-1);
        break;
    }
  }

  selectPrediction(prediction: PlacePrediction): void {
    this.inputValue.set(prediction.description);
    this.showSuggestions.set(false);
    this.selectedIndex.set(-1);
    this.placeSelected.emit(prediction);
  }

  getPredictionDisplayText(prediction: PlacePrediction): string {
    return prediction.structured_formatting?.main_text || prediction.description;
  }

  getPredictionSecondaryText(prediction: PlacePrediction): string {
    return prediction.structured_formatting?.secondary_text || '';
  }
}
