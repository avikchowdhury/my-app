import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BudgetAdvisorCategory } from '../../../models';

@Component({
  selector: 'app-budget-watchlist',
  templateUrl: './budget-watchlist.component.html',
  styleUrls: ['./budget-watchlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetWatchlistComponent {
  @Input() categories: BudgetAdvisorCategory[] = [];

  get visibleCategories(): BudgetAdvisorCategory[] {
    return this.categories.slice(0, 5);
  }

  trackByCategory(_: number, item: BudgetAdvisorCategory): string {
    return item.category;
  }

  getRiskLabel(riskLevel: BudgetAdvisorCategory['riskLevel']): string {
    switch (riskLevel) {
      case 'critical':
        return 'Over pace';
      case 'warning':
        return 'Watch';
      case 'positive':
        return 'Stable';
      default:
        return 'No signal';
    }
  }

  getProjectedUsagePercent(category: BudgetAdvisorCategory): number {
    if (!category.budget || category.budget <= 0) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(100, Math.round((category.projectedSpend / category.budget) * 100)),
    );
  }

  getProjectedUsageValue(category: BudgetAdvisorCategory): number {
    if (!category.budget || category.budget <= 0) {
      return 0;
    }

    return Math.round((category.projectedSpend / category.budget) * 100);
  }
}
