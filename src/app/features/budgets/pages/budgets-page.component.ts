import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Budget } from '../../../models';
import { BudgetService } from '../../../services/budget.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { BudgetEditDialogComponent } from '../components/budget-edit-dialog.component';

@Component({
  selector: 'app-budgets-page',
  templateUrl: './budgets-page.component.html',
  styleUrls: ['./budgets-page.component.scss'],
})
export class BudgetsPageComponent implements OnInit {
  budgets: Budget[] = [];
  displayedColumns: string[] = ['period', 'category', 'amount', 'actions'];
  loading = false;

  constructor(
    private budgetService: BudgetService,
    private dialog: MatDialog,
    private notification: NotificationService,
  ) {}

  ngOnInit() {
    this.loadBudgets();
  }

  get activeBudgetCount(): number {
    return this.budgets.length;
  }

  get totalBudgetAmount(): number {
    return this.budgets.reduce(
      (total, budget) => total + (Number(budget.amount) || 0),
      0,
    );
  }

  get trackedCategoryCount(): number {
    return new Set(
      this.budgets
        .map((budget) => budget.category?.trim())
        .filter((category): category is string => !!category),
    ).size;
  }

  loadBudgets() {
    this.loading = true;
    this.budgetService.getBudgets().subscribe({
      next: (data: any[]) => {
        // Map backend fields to Budget model
        this.budgets = data.map((item) => ({
          id: item.id,
          period: item.lastReset ? item.lastReset.slice(0, 7) : '',
          category: item.category,
          amount: item.monthlyLimit,
        }));
        this.loading = false;
      },
      error: () => {
        this.notification.error('Failed to load budgets');
        this.loading = false;
      },
    });
  }

  // Add Budget
  addBudget() {
    const dialogRef = this.dialog.open(BudgetEditDialogComponent, {
      width: '400px',
      data: {},
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.category && result.amount) {
        this.budgetService
          .addBudget({
            period: new Date().toISOString().slice(0, 7), // e.g., '2026-03'
            category: result.category,
            amount: result.amount,
          })
          .subscribe({
            next: () => {
              this.notification.success('Budget added');
              this.loadBudgets();
            },
            error: () => this.notification.error('Failed to add budget'),
          });
      }
    });
  }

  editBudget(budget: Budget) {
    const dialogRef = this.dialog.open(BudgetEditDialogComponent, {
      width: '400px',
      data: { budget },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.category && result.amount !== undefined) {
        this.budgetService
          .updateBudget(budget.id, {
            category: result.category,
            amount: result.amount,
            lastReset: budget.lastReset, // preserve lastReset
          })
          .subscribe({
            next: () => {
              this.notification.success('Budget updated');
              this.loadBudgets();
            },
            error: () => this.notification.error('Failed to update budget'),
          });
      }
    });
  }

  deleteBudget(budget: Budget) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Delete Budget',
        message: 'Are you sure you want to delete this budget?',
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.budgetService.deleteBudget(budget.id).subscribe({
          next: () => {
            this.notification.success('Budget deleted');
            this.loadBudgets();
          },
          error: () => this.notification.error('Failed to delete budget'),
        });
      }
    });
  }
}
