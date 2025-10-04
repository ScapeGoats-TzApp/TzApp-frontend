import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from '../../components/navigation';

@Component({
  selector: 'app-chatbot-page',
  standalone: true,
  imports: [CommonModule, NavigationComponent],
  templateUrl: './chatbot-page.html',
  styleUrl: './chatbot-page.scss'
})
export class ChatbotPage {

}
