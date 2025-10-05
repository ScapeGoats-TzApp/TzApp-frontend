import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NavigationComponent } from '../../components/navigation';
import { Nl2brPipe } from '../../pipes/nl2br.pipe';
import { UserProfileService } from '../../services/user-profile.service';
import { ChatService, ChatMessage, SavedChat } from '../../services/chat.service';
import { ProfilePictureService } from '../../services/profile-picture.service';

// Remove duplicate interface - using the one from ChatService

@Component({
  selector: 'app-chatbot-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, NavigationComponent, Nl2brPipe],
  templateUrl: './chatbot-page.html',
  styleUrl: './chatbot-page.scss'
})
export class ChatbotPage implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  messages: ChatMessage[] = [];
  currentMessage: string = '';
  isLoading: boolean = false;
  sessionId: string = '';
  userGoatImageUrl: string = '';
  currentChat: SavedChat | null = null;
  savedChats: SavedChat[] = [];
  showSaveDialog: boolean = false;
  showChatHistory: boolean = false;
  chatTitle: string = '';
  private apiUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private userProfileService: UserProfileService,
    private chatService: ChatService,
    public profilePictureService: ProfilePictureService
  ) {
    // Generate a unique session ID
    this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  ngOnInit() {
    // Load user's profile picture from the new service (default to profile1.jpg)
    this.userGoatImageUrl = this.profilePictureService.getProfilePicPath();

    // Subscribe to current chat changes
    this.chatService.getCurrentChat().subscribe(chat => {
      this.currentChat = chat;
      if (chat) {
        this.messages = chat.messages.filter(msg => msg.role !== 'system');
      }
    });

    // Subscribe to saved chats
    this.chatService.getSavedChats().subscribe(chats => {
      this.savedChats = chats;
    });

    // Add initial assistant message if no current chat
    if (!this.currentChat) {
      this.messages.push({
        role: 'assistant',
        content: "Hello there! 🌟\nI'm your travel and future planning assistant, ready to help you design your next adventure or brainstorm exciting plans. Whether you're looking for vacation ideas, future goals, or just some fun suggestions, I'm here for it all!\nWhat's your next big idea? Let's get started!",
        timestamp: new Date()
      });
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) {
      return;
    }

    const userMessage = this.currentMessage.trim();
    this.currentMessage = '';

    // Add user message to chat
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    this.isLoading = true;

    // Send message to backend
    this.http.post(`${this.apiUrl}/chat`, {
      message: userMessage,
      session_id: this.sessionId
    }).subscribe({
      next: (response: any) => {
        this.messages.push({
          role: 'assistant',
          content: response.response,
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.messages.push({
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again later. 😔",
          timestamp: new Date()
        });
        this.isLoading = false;
      }
    });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat() {
    this.messages = [];
    this.http.post(`${this.apiUrl}/chat/clear`, {
      session_id: this.sessionId
    }).subscribe({
      next: () => {
        // Regenerate session ID for new conversation
        this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        // Clear current chat
        this.chatService.clearCurrentChat();
        this.currentChat = null;
        // Add initial assistant message
        this.messages.push({
          role: 'assistant',
          content: "Hello there! 🌟\nI'm your travel and future planning assistant, ready to help you design your next adventure or brainstorm exciting plans. Whether you're looking for vacation ideas, future goals, or just some fun suggestions, I'm here for it all!\nWhat's your next big idea? Let's get started!",
          timestamp: new Date()
        });
      },
      error: (error) => {
        console.error('Error clearing chat:', error);
      }
    });
  }

  // Save current chat
  saveChat() {
    if (this.messages.length <= 1) { // Only initial message
      alert('No messages to save yet!');
      return;
    }

    this.showSaveDialog = true;
    this.chatTitle = `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
  }

  confirmSaveChat() {
    if (!this.chatTitle.trim()) {
      alert('Please enter a title for the chat!');
      return;
    }

    this.chatService.saveChat(this.sessionId, this.chatTitle).subscribe({
      next: (response) => {
        this.showSaveDialog = false;
        this.chatTitle = '';
        alert(`Chat saved successfully: ${response.title}`);
      },
      error: (error) => {
        console.error('Error saving chat:', error);
        alert('Error saving chat!');
      }
    });
  }

  cancelSaveChat() {
    this.showSaveDialog = false;
    this.chatTitle = '';
  }

  // Load a saved chat
  loadChat(chatId: string) {
    this.chatService.loadChat(chatId).subscribe({
      next: (chat) => {
        this.currentChat = chat;
        this.sessionId = chat.session_id;
        this.messages = chat.messages.filter(msg => msg.role !== 'system');
        this.showChatHistory = false; // Close the modal
        alert(`Chat loaded: ${chat.title}`);
      },
      error: (error) => {
        console.error('Error loading chat:', error);
        alert('Error loading chat!');
      }
    });
  }

  // Delete a saved chat
  deleteChat(chatId: string, event: Event) {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this chat?')) {
      this.chatService.deleteChat(chatId).subscribe({
        next: () => {
          alert('Chat deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting chat:', error);
          alert('Error deleting chat!');
        }
      });
    }
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Check if there are messages to save
  hasMessagesToSave(): boolean {
    return this.messages.length > 1; // More than just the initial message
  }

  // Toggle chat history modal
  toggleChatHistory() {
    this.showChatHistory = !this.showChatHistory;
  }
}
