import { Injectable, inject, signal } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../config/env';

export interface CollaborationMessage {
  type: 'MOVE' | 'ADD' | 'DELETE' | 'PROJECT_UPDATED' | 'USER_JOINED' | 'USER_LEFT';
  projectId: string;
  userId: string;
  username: string;
  payload: any;
}

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private authService = inject(AuthService);
  private stompClient: Client | null = null;

  // Señales y observadores para el estado y los mensajes
  public isConnected = signal<boolean>(false);
  public messages$ = new Subject<CollaborationMessage>();

  connect(projectId: string) {
    if (this.stompClient && this.stompClient.active) {
      return;
    }

    const token = this.authService.getToken();
    const user = this.authService.currentUser();

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiUrl.replace('/api', '')}/ws-uml`),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        // console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.stompClient.onConnect = (frame) => {
      this.isConnected.set(true);

      // Suscribirse al canal del proyecto
      this.stompClient?.subscribe(`/topic/project/${projectId}`, (message: Message) => {
        if (message.body) {
          const collabMsg: CollaborationMessage = JSON.parse(message.body);
          // Ignorar mensajes propios para no entrar en bucle
          if (collabMsg.userId !== user?.id) {
            this.messages$.next(collabMsg);
          }
        }
      });

      // Notificar que nos hemos unido (Presencia)
      this.sendPresence(projectId, 'USER_JOINED');
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP Error', frame.headers['message']);
      this.isConnected.set(false);
    };

    this.stompClient.onDisconnect = () => {
      this.isConnected.set(false);
    };

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.isConnected.set(false);
    }
  }

  sendUpdate(projectId: string, type: 'MOVE' | 'ADD' | 'DELETE', payload: any) {
    if (!this.stompClient || !this.stompClient.connected) return;

    const user = this.authService.currentUser();
    const message: CollaborationMessage = {
      type,
      projectId,
      userId: user?.id || '',
      username: user?.nombres || 'Usuario',
      payload
    };

    this.stompClient.publish({
      destination: `/app/project/${projectId}/update`,
      body: JSON.stringify(message)
    });
  }

  private sendPresence(projectId: string, type: 'USER_JOINED' | 'USER_LEFT') {
    const user = this.authService.currentUser();
    const message: CollaborationMessage = {
      type,
      projectId,
      userId: user?.id || '',
      username: user?.nombres || 'Usuario',
      payload: null
    };

    this.stompClient?.publish({
      destination: `/app/project/${projectId}/presence`,
      body: JSON.stringify(message)
    });
  }
}
