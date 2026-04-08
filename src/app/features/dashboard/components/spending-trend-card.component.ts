import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-spending-trend-card',
  templateUrl: './spending-trend-card.component.html',
  styleUrls: ['./spending-trend-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpendingTrendCardComponent {
  @Input() data: ChartData<'bar'> = { labels: [], datasets: [] };
  @Input() options: ChartConfiguration['options'] = {};
  @Input() type: ChartType = 'bar';

  get hasChartData(): boolean {
    return this.series.some((value) => value > 0);
  }

  get latestMonth(): string {
    return this.labels[this.labels.length - 1] || 'No month yet';
  }

  get latestValue(): number {
    return this.series[this.series.length - 1] || 0;
  }

  get peakMonth(): string {
    if (!this.series.length) {
      return 'No peak yet';
    }

    const peakIndex = this.series.reduce(
      (bestIndex, value, index, values) => (value > values[bestIndex] ? index : bestIndex),
      0
    );

    return this.labels[peakIndex] || 'No peak yet';
  }

  get peakValue(): number {
    return this.series.length ? Math.max(...this.series) : 0;
  }

  get averageValue(): number {
    return this.series.length
      ? this.series.reduce((total, value) => total + value, 0) / this.series.length
      : 0;
  }

  get paceLabel(): string {
    if (this.series.length < 2) {
      return 'Waiting for more monthly history';
    }

    const latest = this.series[this.series.length - 1];
    const previous = this.series[this.series.length - 2];

    if (latest > previous) {
      return 'Spending is climbing compared with the prior month';
    }

    if (latest < previous) {
      return 'Spending eased compared with the prior month';
    }

    return 'Spending pace is holding steady';
  }

  private get labels(): string[] {
    return (this.data.labels || []).map((label) => `${label}`);
  }

  private get series(): number[] {
    return (this.data.datasets?.[0]?.data || [])
      .map((value) => {
        if (typeof value === 'number') {
          return value;
        }

        if (Array.isArray(value)) {
          return Number(value[1] ?? value[0] ?? 0);
        }

        if (value && typeof value === 'object' && 'y' in value) {
          return Number((value as { y?: unknown }).y ?? 0);
        }

        return Number(value ?? 0);
      })
      .filter((value) => Number.isFinite(value));
  }
}
