import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  readonly id: number;
  readonly title: string;
  readonly message?: string;
  readonly tone: ToastTone;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly messagesState = signal<readonly ToastMessage[]>([]);
  readonly messages = this.messagesState.asReadonly();

  show(title: string, message?: string, tone: ToastTone = 'success'): void {
    const id = this.nextId++;
    this.messagesState.update((messages) => [...messages, { id, title, message, tone }]);
    window.setTimeout(() => this.dismiss(id), 5200);
  }

  dismiss(id: number): void {
    this.messagesState.update((messages) => messages.filter((message) => message.id !== id));
  }
}
