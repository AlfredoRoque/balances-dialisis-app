import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/service/NotificationService';
import { AuthService } from '../../../core/service/AuthService';
import { Utility } from '../../../core/service/util/utility';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-banner.component.html',
  styleUrls: ['./notification-banner.component.scss']
})
export class NotificationBannerComponent implements OnInit, OnDestroy {

  message: string = '';
  visible: boolean = false;

  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;
  private triggerSub: Subscription | null = null;
  private apiSub: Subscription | null = null;
  private visibilitySub: Subscription | null = null;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private utility: Utility
  ) {}

  ngOnInit(): void {
    this.triggerSub = this.notificationService.onLoginNotification().subscribe(() => {
      this.checkNotification();
    });

    this.visibilitySub = this.notificationService.isBannerVisible$().subscribe(visible => {
      if (!visible && this.visible) {
        this.visible = false;
        this.clearTimer();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.triggerSub?.unsubscribe();
    this.apiSub?.unsubscribe();
    this.visibilitySub?.unsubscribe();
  }

  private checkNotification(): void {
    const token = this.authService.getToken();
    const role = this.utility.getUserRoleFromToken(token);

    if (role !== 'ADMIN') {
      return;
    }

    this.apiSub = this.notificationService.balanceHistoryCleanNotification().subscribe({
        next: (notification) => {
        if (notification.notification) {
          this.message = notification.message;
          this.visible = true;
          this.notificationService.setBannerVisible(true);
          this.clearTimer();
          this.autoHideTimer = setTimeout(() => this.dismiss(), 5 * 60 * 1000);// Auto-hide after 5 minutes
        }
      },
      error: (err) => {
        console.error('[NotificationBanner] API error:', err);
      }
    });
  }

  dismiss(): void {
    this.visible = false;
    this.notificationService.setBannerVisible(false);
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }
}
