import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UserStatus } from '../../core/models/user.model';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="status-badge" [class]="'status-badge status-badge--' + status()">
      <span class="status-badge__dot"></span>
      {{ label() }}
    </span>
  `,
  styles: `
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 9px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 650;
      line-height: 1;
      white-space: nowrap;
    }

    .status-badge__dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: currentColor;
    }

    .status-badge--active {
      color: #15755b;
      background: #e9f7f2;
    }

    .status-badge--invited {
      color: #9a6515;
      background: #fff6df;
    }

    .status-badge--suspended {
      color: #a44747;
      background: #fff0ef;
    }
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<UserStatus>();
  readonly label = computed(() => {
    const labels: Record<UserStatus, string> = {
      active: 'Active',
      invited: 'Invited',
      suspended: 'Suspended',
    };
    return labels[this.status()];
  });
}
