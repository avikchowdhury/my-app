import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { BudgetEditDialogComponent } from './components/budget-edit-dialog.component';
import { BudgetsPageComponent } from './pages/budgets-page.component';
import { BudgetsRoutingModule } from './budgets-routing.module';

@NgModule({
  declarations: [BudgetsPageComponent, BudgetEditDialogComponent],
  imports: [SharedModule, BudgetsRoutingModule]
})
export class BudgetsModule {}
