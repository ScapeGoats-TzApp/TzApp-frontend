import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from '../../components/navigation';
import { CalendarPickerComponent } from '../../components/calendar-picker/calendar-picker.component';
import { PlacePrediction } from '../../services/weather.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, NavigationComponent, CalendarPickerComponent],
  templateUrl: './explore.html',
  styleUrl: './explore.scss'
})
export class ExplorePage {
  selectedDate = signal(new Date());

  onDateSelected(date: Date): void {
    this.selectedDate.set(date);
    console.log('Selected date:', date);
  }

  onPlaceSelected(prediction: PlacePrediction): void {
    console.log('Selected place:', prediction);
    // Here you can handle the place selection logic
  }
}
