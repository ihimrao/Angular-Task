import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="avatar"
      [class.avatar--small]="size() === 'small'"
      [class.avatar--large]="size() === 'large'"
      [style.background]="background()"
      [attr.aria-label]="firstName() + ' ' + lastName()"
    >
      {{ initials() }}
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: 0 0 auto;
    }

    .avatar {
      width: 38px;
      height: 38px;
      display: inline-grid;
      place-items: center;
      border-radius: 12px;
      color: #fff;
      font-size: 12px;
      line-height: 1;
      font-weight: 730;
      letter-spacing: 0.02em;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
    }

    .avatar--small {
      width: 30px;
      height: 30px;
      border-radius: 9px;
      font-size: 10px;
    }

    .avatar--large {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      font-size: 18px;
    }
  `,
})
export class AvatarComponent {
  readonly firstName = input.required<string>();
  readonly lastName = input.required<string>();
  readonly color = input('#6955d9');
  readonly size = input<'small' | 'default' | 'large'>('default');

  readonly initials = computed(() => {
    const first = this.firstName().trim().charAt(0);
    const last = this.lastName().trim().charAt(0);
    return `${first}${last}`.toUpperCase() || '?';
  });

  readonly background = computed(
    () =>
      `linear-gradient(145deg, ${this.color()}, color-mix(in srgb, ${this.color()} 76%, #172033))`,
  );
}
