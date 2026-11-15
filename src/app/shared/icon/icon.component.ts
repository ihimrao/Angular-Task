import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="icon"
      [attr.width]="size()"
      [attr.height]="size()"
      [style.stroke-width]="strokeWidth()"
      aria-hidden="true"
      focusable="false"
    >
      <use [attr.href]="'#icon-' + name()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: 0 0 auto;
    }

    .icon {
      display: block;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input(20);
  readonly strokeWidth = input(1.8);
}
