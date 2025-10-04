import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface SavedChat {
  id: string;
  title: string;
  session_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
  message_count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:5000/api';
  private currentChatSubject = new BehaviorSubject<SavedChat | null>(null);
  private savedChatsSubject = new BehaviorSubject<SavedChat[]>([]);

  constructor(private http: HttpClient) {
    this.loadSavedChats();
  }

  // Get current chat
  getCurrentChat(): Observable<SavedChat | null> {
    return this.currentChatSubject.asObservable();
  }

  // Get saved chats list
  getSavedChats(): Observable<SavedChat[]> {
    return this.savedChatsSubject.asObservable();
  }

  // Load all saved chats from backend
  loadSavedChats(): void {
    this.http.get<{chats: SavedChat[]}>(`${this.apiUrl}/chat/list`)
      .pipe(
        map(response => response.chats),
        catchError(error => {
          console.error('Error loading saved chats:', error);
          return [];
        })
      )
      .subscribe(chats => {
        this.savedChatsSubject.next(chats);
      });
  }

  // Save current chat
  saveChat(sessionId: string, title?: string): Observable<{chat_id: string, title: string}> {
    const chatTitle = title || `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    
    return this.http.post<{chat_id: string, title: string, message: string}>(
      `${this.apiUrl}/chat/save`,
      {
        session_id: sessionId,
        title: chatTitle
      }
    ).pipe(
      map(response => {
        // Reload saved chats list
        this.loadSavedChats();
        return { chat_id: response.chat_id, title: response.title };
      }),
      catchError(error => {
        console.error('Error saving chat:', error);
        throw error;
      })
    );
  }

  // Load a specific chat
  loadChat(chatId: string): Observable<SavedChat> {
    return this.http.get<SavedChat>(`${this.apiUrl}/chat/load/${chatId}`)
      .pipe(
        map(chat => {
          // Convert messages to include timestamps
          const messagesWithTimestamps = chat.messages.map(msg => ({
            ...msg,
            timestamp: new Date()
          }));
          
          const loadedChat: SavedChat = {
            ...chat,
            messages: messagesWithTimestamps
          };
          
          this.currentChatSubject.next(loadedChat);
          return loadedChat;
        }),
        catchError(error => {
          console.error('Error loading chat:', error);
          throw error;
        })
      );
  }

  // Delete a chat
  deleteChat(chatId: string): Observable<void> {
    return this.http.delete<{message: string}>(`${this.apiUrl}/chat/delete/${chatId}`)
      .pipe(
        map(() => {
          // Remove from local list
          const currentChats = this.savedChatsSubject.value;
          const updatedChats = currentChats.filter(chat => chat.id !== chatId);
          this.savedChatsSubject.next(updatedChats);
          
          // Clear current chat if it was deleted
          const currentChat = this.currentChatSubject.value;
          if (currentChat && currentChat.id === chatId) {
            this.currentChatSubject.next(null);
          }
        }),
        catchError(error => {
          console.error('Error deleting chat:', error);
          throw error;
        })
      );
  }

  // Update chat title
  updateChatTitle(chatId: string, newTitle: string): Observable<{chat_id: string, title: string}> {
    return this.http.put<{chat_id: string, title: string, message: string}>(
      `${this.apiUrl}/chat/update/${chatId}`,
      { title: newTitle }
    ).pipe(
      map(response => {
        // Update local list
        const currentChats = this.savedChatsSubject.value;
        const updatedChats = currentChats.map(chat => 
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        );
        this.savedChatsSubject.next(updatedChats);
        
        // Update current chat if it's the one being updated
        const currentChat = this.currentChatSubject.value;
        if (currentChat && currentChat.id === chatId) {
          this.currentChatSubject.next({ ...currentChat, title: newTitle });
        }
        
        return { chat_id: response.chat_id, title: response.title };
      }),
      catchError(error => {
        console.error('Error updating chat title:', error);
        throw error;
      })
    );
  }

  // Clear current chat
  clearCurrentChat(): void {
    this.currentChatSubject.next(null);
  }

  // Get current chat value
  getCurrentChatValue(): SavedChat | null {
    return this.currentChatSubject.value;
  }

  // Get saved chats value
  getSavedChatsValue(): SavedChat[] {
    return this.savedChatsSubject.value;
  }
}
