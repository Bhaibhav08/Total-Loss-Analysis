import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  // Password Visibility Toggle
  showPassword: boolean = false;

  // Sign In fields
  email: string = 'bhaibhav.raj@retail.com';
  password: string = 'admin123';

  loading: boolean = false;
  errorMessage: string | null = null;
  showHelpNotice: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter your corporate email and security password.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    setTimeout(() => {
      const result = this.authService.login(this.email, this.password);
      this.loading = false;

      if (result.success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = result.message || 'Access denied. Invalid credentials.';
      }
    }, 300);
  }

  toggleHelpNotice(): void {
    this.showHelpNotice = !this.showHelpNotice;
  }
}
