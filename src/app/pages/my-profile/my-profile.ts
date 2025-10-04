import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from '../../components/navigation';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, NavigationComponent],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.scss'
})
export class MyProfile {

}
