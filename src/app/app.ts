import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastService } from './core/services/toast.service';
import { AvatarComponent } from './shared/avatar/avatar.component';
import { IconComponent } from './shared/icon/icon.component';
import { ToastStackComponent } from './shared/toast-stack/toast-stack.component';

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AvatarComponent,
    IconComponent,
    ToastStackComponent,
  ],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly menuOpen = signal(false);
  protected readonly pageTitle = signal('People');

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuOpen.set(false);
        let route = this.router.routerState.root;
        while (route.firstChild) route = route.firstChild;
        const routeTitle = route.snapshot.data['pageTitle'];
        this.pageTitle.set(typeof routeTitle === 'string' ? routeTitle : 'People');
      });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  showNotifications(): void {
    this.toast.show('You’re all caught up', 'There are no new notifications.', 'info');
  }

  showHelp(): void {
    this.toast.show('Help center', 'Product documentation and support are coming soon.', 'info');
  }
}
