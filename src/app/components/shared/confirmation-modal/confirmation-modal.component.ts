import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface ConfirmationModalData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmButtonClass: string;
  showReasonInput?: boolean;
  reasonPlaceholder?: string;
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: false,
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent {
  @Input() isVisible = false;
  @Input() data: ConfirmationModalData = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmButtonClass: 'btn-primary'
  };

  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  reason = '';

  onConfirm() {
    this.confirmed.emit(this.reason);
    this.close();
  }

  onCancel() {
    this.cancelled.emit();
    this.close();
  }

  close() {
    this.reason = '';
    this.isVisible = false;
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}