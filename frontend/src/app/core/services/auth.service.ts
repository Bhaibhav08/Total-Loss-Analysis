import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfile {
  name: string;
  initials: string;
  email: string;
  role: string;
  department: string;
  location: string;
  lastLogin: string;
  password?: string;
}

// Enterprise Account Store Database
export const REGISTERED_ACCOUNTS: UserProfile[] = [
  {
    name: 'Bhaibhav Raj',
    initials: 'BR',
    email: 'bhaibhav.raj@retail.com',
    role: 'Lead Loss Prevention Analyst',
    department: 'Retail Operations & Risk',
    location: 'Corporate HQ — Bangalore',
    lastLogin: 'Today at 03:14 AM',
    password: 'admin123'
  },
  {
    name: 'Devallabala Adhtiya',
    initials: 'DA',
    email: 'devallabala.adhtiya@retail.com',
    role: 'Regional Security Director',
    department: 'North & East Division',
    location: 'Regional HQ — Delhi',
    lastLogin: 'Today at 08:30 AM',
    password: 'admin123'
  },
  {
    name: 'Saatvik',
    initials: 'SA',
    email: 'saatvik@retail.com',
    role: 'VP of Retail Operations',
    department: 'Executive Enterprise Risk',
    location: 'Corporate HQ — Mumbai',
    lastLogin: 'Yesterday at 05:45 PM',
    password: 'admin123'
  }
];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(REGISTERED_ACCOUNTS[0]);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(true);

  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor() {}

  public get currentUserValue(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  login(email: string, pass: string): { success: boolean; message?: string } {
    const matched = REGISTERED_ACCOUNTS.find(
      a => a.email.toLowerCase() === (email || '').trim().toLowerCase()
    );

    if (!matched) {
      return { 
        success: false, 
        message: `Account not found for '${email}'. Please check your corporate email or Sign Up.` 
      };
    }

    if (matched.password && matched.password !== pass) {
      return { 
        success: false, 
        message: 'Invalid security password. Please re-enter or reset your password.' 
      };
    }

    const updatedUser: UserProfile = {
      ...matched,
      lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.currentUserSubject.next(updatedUser);
    this.isAuthenticatedSubject.next(true);
    return { success: true };
  }

  register(name: string, email: string, role: string, department: string, pass: string): { success: boolean; message?: string } {
    const existing = REGISTERED_ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return { success: false, message: 'An account with this corporate email already exists. Please Sign In.' };
    }

    const parts = name.trim().split(' ');
    const initials = parts.map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase() || 'AD';
    const newUser: UserProfile = {
      name: name.trim(),
      initials,
      email: email.trim().toLowerCase(),
      role: role.trim() || 'Loss Operations Analyst',
      department: department.trim() || 'Retail Security',
      location: 'Enterprise HQ',
      lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      password: pass || 'admin123'
    };

    REGISTERED_ACCOUNTS.push(newUser);
    this.currentUserSubject.next(newUser);
    this.isAuthenticatedSubject.next(true);
    return { success: true };
  }

  updatePassword(email: string, newPass: string): boolean {
    const admin = REGISTERED_ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
    if (admin) {
      admin.password = newPass;
      if (this.currentUserValue?.email.toLowerCase() === email.trim().toLowerCase()) {
        this.currentUserSubject.next({
          ...this.currentUserValue,
          password: newPass
        });
      }
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}
