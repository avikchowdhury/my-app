import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-category-breakdown-card',
  templateUrl: './category-breakdown-card.component.html',
  styleUrls: ['./category-breakdown-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryBreakdownCardComponent {
  @Input() data: ChartData<'doughnut'> = { labels: [], datasets: [] };
  @Input() type: ChartType = 'doughnut';
  @Input() topCategory = 'N/A';

  readonly chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };

  get hasChartData(): boolean {
    return this.legendItems.some((item) => item.value > 0);
  }

  get trackedTotal(): number {
    return this.legendItems.reduce((total, item) => total + item.value, 0);
  }

  get legendItems(): Array<{ label: string; value: number; color: string; share: number }> {
    const labels = (this.data.labels || []).map((label) => `${label}`);
    const values = (this.data.datasets?.[0]?.data || []).map((value) => Number(value ?? 0));
    const colors = Array.isArray(this.data.datasets?.[0]?.backgroundColor)
      ? this.data.datasets[0].backgroundColor.map((color) => `${color}`)
      : [];
    const total = values.reduce((sum, value) => sum + value, 0);

    return labels.map((label, index) => ({
      label,
      value: values[index] || 0,
      color: colors[index] || '#c9d7df',
      share: total > 0 ? Math.round(((values[index] || 0) / total) * 100) : 0
    }));
  }
}
