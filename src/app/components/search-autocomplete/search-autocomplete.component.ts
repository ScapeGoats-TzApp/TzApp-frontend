import { Component, EventEmitter, Input, Output, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeatherService, PlacePrediction } from '../../services/weather.service';
import { GoogleMapsService } from '../../services/google-maps.service';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';

@Component({
  selector: 'app-search-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-autocomplete.component.html',
  styleUrl: './search-autocomplete.component.scss'
})
export class SearchAutocompleteComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Search for a city';
  @Input() disabled = false;
  @Output() placeSelected = new EventEmitter<PlacePrediction>();

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

