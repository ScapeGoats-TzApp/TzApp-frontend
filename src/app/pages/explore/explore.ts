import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from '../../components/navigation';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, NavigationComponent],
  templateUrl: './explore.html',
  styleUrl: './explore.scss'
})
export class ExplorePage {

}
