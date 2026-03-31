import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlanIndicatorButtonComponent } from './shared/components/plan-indicator-button/plan-indicator-button.component';
import { ProfileButtonComponent } from './shared/components/profile-button/profile-button.component';
import { NotificationBannerComponent } from './shared/components/notification-banner/notification-banner.component';
import { NotificationService } from './core/service/NotificationService';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PlanIndicatorButtonComponent, ProfileButtonComponent, NotificationBannerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'balance-dialisis-app';
  bannerVisible = false;
  private sub: Subscription | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.sub = this.notificationService.isBannerVisible$().subscribe(
      visible => this.bannerVisible = visible
    );
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
