import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warn';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number; // ms
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private idSeq = 1;

  show(message: string, type: ToastType = 'info', duration = 3000) {
    const toast: Toast = { id: this.idSeq++, type, message, duration };
    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast.id), duration);
    }
  }

  success(message: string, duration = 3000) { this.show(message, 'success', duration); }
  error(message: string, duration = 4000) { this.show(message, 'error', duration); }
  info(message: string, duration = 3000) { this.show(message, 'info', duration); }
  warn(message: string, duration = 3500) { this.show(message, 'warn', duration); }

  dismiss(id: number) {
    const next = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(next);
  }

  clear() { this.toastsSubject.next([]); }
}
