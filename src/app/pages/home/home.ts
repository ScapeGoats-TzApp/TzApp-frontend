import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from '../../components/navigation';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavigationComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomePage {}
