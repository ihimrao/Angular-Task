import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  input,
  model,
  output,
} from '@angular/core';
import { Role } from '../../../core/models/role.model';
import { User, UserActivity } from '../../../core/models/user.model';
import { formatDateTime, formatRelativeTime } from '../../../core/utils/date.util';
import { AvatarComponent } from '../../../shared/avatar/avatar.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-user-details-drawer',
  imports: [AvatarComponent, IconComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-details-drawer.component.html',
  styleUrl: './user-details-drawer.component.scss',
})
export class UserDetailsDrawerComponent {
  readonly isOpen = model(false);
  readonly user = input<User | null>(null);
  readonly roles = input<readonly Role[]>([]);
  readonly activity = input<readonly UserActivity[]>([]);
  readonly loading = input(false);
  readonly statusUpdating = input(false);
  readonly editRequested = output<User>();
  readonly statusToggleRequested = output<User>();

  protected readonly roleName = computed(
    () => this.roles().find((role) => role.id === this.user()?.roleId)?.name ?? 'Unassigned',
  );
  protected readonly formatRelative = formatRelativeTime;
  protected readonly formatFullDate = formatDateTime;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.isOpen.set(false);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  requestEdit(): void {
    const value = this.user();
    if (value) {
      this.isOpen.set(false);
      this.editRequested.emit(value);
    }
  }

  requestStatusToggle(): void {
    const value = this.user();
    if (value) this.statusToggleRequested.emit(value);
  }
}
