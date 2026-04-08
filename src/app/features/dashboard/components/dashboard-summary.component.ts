import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DashboardMetricCard } from '../dashboard-page.component';

@Component({
  selector: 'app-dashboard-summary',
  templateUrl: './dashboard-summary.component.html',
  styleUrls: ['./dashboard-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardSummaryComponent {
  @Input() metrics: DashboardMetricCard[] = [];
}
