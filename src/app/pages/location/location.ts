import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NavigationComponent } from '../../components/navigation';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, NavigationComponent],
  templateUrl: './location.html',
  styleUrl: './location.scss'
})
export class LocationComponent {
  locationName: string = 'CIOROGARLA';

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.locationName = params['id']?.toUpperCase() || 'CIOROGARLA';
    });
  }
}
