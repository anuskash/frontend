import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface SuccessModalData {
  title: string;
  message: string;
  icon: string; // Font Awesome icon class
  iconColor: string;
  buttonText: string;
}

@Component({
  selector: 'app-success-modal',
  standalone: false,
  templateUrl: './success-modal.component.html',
  styleUrls: ['./success-modal.component.scss']
})
export class SuccessModalComponent {
  @Input() isVisible = false;
  @Input() data: SuccessModalData = {
    title: 'Success',
    message: 'Operation completed successfully',
    icon: 'fas fa-check-circle',
    iconColor: '#38a169',
    buttonText: 'OK'
  };

  @Output() closed = new EventEmitter<void>();

  onClose() {
    this.closed.emit();
    this.isVisible = false;
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}