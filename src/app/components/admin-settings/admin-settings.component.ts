import { Component, OnInit } from '@angular/core';
import { AdminService, ProhibitedKeyword, CreateProhibitedKeyword } from '../../services/admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-admin-settings',
  standalone: false,
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit {
  loading = false;
  error?: string;
  keywords: ProhibitedKeyword[] = [];
  form: FormGroup;
  adding = false;

  categories = ['drugs','weapons','alcohol','tobacco','profanity','scam_indicators'];
  severities = ['LOW','MEDIUM','HIGH'];
  autoActions = ['WARN','FLAG','REJECT'];

  constructor(private adminService: AdminService, private fb: FormBuilder) {
    this.form = this.fb.group({
      keyword: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', []],  // Make category truly optional
      severity: ['MEDIUM', Validators.required],
      autoAction: ['FLAG', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadKeywords();
  }

  loadKeywords(): void {
    this.loading = true;
    this.error = undefined;
    this.adminService.getProhibitedKeywords().subscribe({
      next: list => { this.keywords = list; this.loading = false; },
      error: () => { this.error = 'Failed to load keywords'; this.loading = false; }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      alert('Please fill in all required fields');
      return;
    }
    
    this.adding = true;
    const payload: CreateProhibitedKeyword = {
      keyword: this.form.value.keyword?.trim(),
      category: this.form.value.category || undefined,
      severity: this.form.value.severity || 'MEDIUM',
      autoAction: this.form.value.autoAction || 'FLAG'
    };
    
    // Check for empty keyword
    if (!payload.keyword) {
      alert('Keyword cannot be empty');
      this.adding = false;
      return;
    }
    
    // Check for duplicate
    if (this.keywords.some(k => k.keyword.toLowerCase() === payload.keyword!.toLowerCase())) {
      alert(`Keyword "${payload.keyword}" already exists`);
      this.adding = false;
      return;
    }
    
    this.adminService.addProhibitedKeyword(payload).subscribe({
      next: k => { 
        this.keywords = [k, ...this.keywords]; 
        this.form.reset({severity:'MEDIUM', autoAction:'FLAG'}); 
        this.adding = false; 
      },
      error: err => { 
        console.error('Failed to add keyword:', err);
        let errorMsg = 'Failed to add keyword';
        if (err.error?.message) {
          errorMsg += `: ${err.error.message}`;
        } else if (err.error) {
          errorMsg += `: ${err.error}`;
        } else if (err.status === 401 || err.status === 403) {
          errorMsg = 'Unauthorized: Admin access required';
        } else if (err.status === 409) {
          errorMsg = 'Keyword already exists';
        }
        alert(errorMsg);
        this.adding = false; 
      }
    });
  }

  remove(k: ProhibitedKeyword): void {
    if (!confirm(`Delete keyword "${k.keyword}"?`)) return;
    this.adminService.deleteProhibitedKeyword(k.id).subscribe({
      next: () => { this.keywords = this.keywords.filter(x => x.id !== k.id); },
      error: () => alert('Failed to delete keyword')
    });
  }
}
