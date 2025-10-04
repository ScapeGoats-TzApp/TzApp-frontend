import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavigationComponent } from '../../components/navigation';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [CommonModule, NavigationComponent, RouterLink],
  templateUrl: './saved.html',
  styleUrl: './saved.scss'
})
export class SavedComponent {

}
