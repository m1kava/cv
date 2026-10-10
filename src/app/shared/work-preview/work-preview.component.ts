import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PreviewKind = 'site' | 'odds' | 'board' | 'chart';

/** Small animated illustration of a project, used on work cards. */
@Component({
  selector: 'app-work-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styleUrl: './work-preview.component.scss',
  template: `
    @switch (kind()) {
      @case ('site') {
        <div class="browser">
          <div class="browser__bar">
            <i></i><i></i><i></i>
            <span class="browser__url">🔒 {{ domain() }}</span>
          </div>
          <div class="browser__page">
            <span class="browser__nav"></span>
            <span class="browser__hero"></span>
            <span class="browser__line"></span>
            <span class="browser__line browser__line--short"></span>
            <div class="browser__cards"><span></span><span></span><span></span></div>
          </div>
        </div>
      }
      @case ('odds') {
        <div class="preview preview--odds">
          @for (row of [0, 1, 2]; track row) {
            <div class="odds-row">
              <i></i>
              @for (cell of [0, 1, 2]; track cell) {
                <b [style.animation-delay]="(row * 3 + cell) * 0.37 + 's'"></b>
              }
            </div>
          }
        </div>
      }
      @case ('board') {
        <div class="preview preview--board">
          @for (col of columns; track $index) {
            <div class="board-col">
              @for (card of col; track $index) {
                <span></span>
              }
            </div>
          }
        </div>
      }
      @case ('chart') {
        <div class="preview preview--chart">
          @for (h of bars; track $index) {
            <span class="bar" [class.down]="$index % 3 === 2" [style.height.%]="h"></span>
          }
        </div>
      }
    }
  `,
})
export class WorkPreviewComponent {
  readonly kind = input.required<PreviewKind>();
  readonly domain = input('');

  readonly columns = [[1, 2, 3], [1, 2], [1]];
  /** Fixed pseudo-random candle heights for the chart preview. */
  readonly bars = [38, 52, 44, 60, 56, 72, 64, 80, 70, 88, 76, 92];
}
