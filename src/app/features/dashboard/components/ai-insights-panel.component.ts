import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AiInsightSnapshot, BudgetStatus } from '../../../models';

@Component({
  selector: 'app-ai-insights-panel',
  templateUrl: './ai-insights-panel.component.html',
  styleUrls: ['./ai-insights-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiInsightsPanelComponent {
  @Input() snapshot: AiInsightSnapshot | null = null;
  @Input() budgetStatus: BudgetStatus | null = null;
}
