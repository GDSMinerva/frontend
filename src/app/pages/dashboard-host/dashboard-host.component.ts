import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-host',
  standalone: true,
  template: '',
})
export class DashboardHostComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const state = this.auth.getAuthState();

    // try user.role first, then decoded token
    const userRole = state.user?.['role'] || this.auth.decodeToken()?.['role'] || 'user';

    if (userRole === 'admin') {
      this.router.navigate(['/dashboard/admin']);
    } else {
      this.router.navigate(['/dashboard/user']);
    }
  }
}
