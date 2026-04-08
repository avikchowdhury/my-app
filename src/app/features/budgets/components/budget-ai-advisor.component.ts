import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BudgetAdvisorSnapshot } from '../../../models';

@Component({
  selector: 'app-budget-ai-advisor',
  templateUrl: './budget-ai-advisor.component.html',
  styleUrls: ['./budget-ai-advisor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetAiAdvisorComponent {
  @Input() advisor: BudgetAdvisorSnapshot | null = null;

  get statusLabel(): string {
    switch (this.advisor?.paceStatus) {
      case 'critical':
        return 'Needs action';
      case 'warning':
        return 'Watch closely';
      case 'positive':
        return 'On pace';
      default:
        return 'Warming up';
    }
  }

  get currentUsagePercent(): number {
    return this.getClampedPercent(
      this.advisor?.currentSpend ?? 0,
      this.advisor?.totalBudget ?? 0,
    );
  }

  get projectedUsagePercent(): number {
    return this.getClampedPercent(
      this.advisor?.projectedSpend ?? 0,
      this.advisor?.totalBudget ?? 0,
    );
  }

  get currentUsageValue(): number {
    return this.getRawPercent(
      this.advisor?.currentSpend ?? 0,
      this.advisor?.totalBudget ?? 0,
    );
  }

  get projectedUsageValue(): number {
    return this.getRawPercent(
      this.advisor?.projectedSpend ?? 0,
      this.advisor?.totalBudget ?? 0,
    );
  }

  private getRawPercent(value: number, total: number): number {
    if (!total || total <= 0) {
      return 0;
    }

    return Math.round((value / total) * 100);
  }

  private getClampedPercent(value: number, total: number): number {
    return Math.max(0, Math.min(100, this.getRawPercent(value, total)));
  }
}
