import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Budget } from '../../../models';

@Component({
  selector: 'app-budget-list-panel',
  templateUrl: './budget-list-panel.component.html',
  styleUrls: ['./budget-list-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetListPanelComponent {
  @Input() budgets: Budget[] = [];
  @Input() loading = false;

  @Output() editRequested = new EventEmitter<Budget>();
  @Output() deleteRequested = new EventEmitter<Budget>();

  readonly displayedColumns: string[] = ['period', 'category', 'amount', 'actions'];
}
