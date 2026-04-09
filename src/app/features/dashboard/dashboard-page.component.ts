import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  AiInsightSnapshot,
  BudgetStatus,
  CategorySpendItem,
  MonthlySpendingItem,
  PaginatedResponse,
  ReceiptDto,
} from '../../models';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { AnalyticsService } from '../../services/analytics.service';
import { BudgetService } from '../../services/budget.service';
import { ReceiptService } from '../../services/receipt.service';

export interface DashboardMetricCard {
  label: string;
  value: string;
  detail: string;
  tone: 'default' | 'positive' | 'warning';
}

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
})
export class DashboardPageComponent implements OnInit {
  loading = true;
  loadError = '';

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `$${value}`,
        },
      },
    },
  };

  barChartType: ChartType = 'bar';
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Monthly spending',
        backgroundColor: '#0f6c5b',
        borderRadius: 10,
      },
    ],
  };

  pieChartType: ChartType = 'doughnut';
  pieChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#0f6c5b',
          '#18a8c1',
          '#ffb25b',
          '#f16b4e',
          '#607d8b',
        ],
      },
    ],
  };

  metrics: DashboardMetricCard[] = [];
  topCategory = 'N/A';
  recentReceipts: ReceiptDto[] = [];
  calendarReceipts: ReceiptDto[] = [];
  budgetStatus: BudgetStatus | null = null;
  aiSnapshot: AiInsightSnapshot | null = null;
  syncing = false;

  constructor(
    private analyticsService: AnalyticsService,
    private receiptService: ReceiptService,
    private budgetService: BudgetService,
    private aiAssistantService: AiAssistantService,
  ) {}

  onExportToExcel(): void {
    this.receiptService.exportToExcel();
  }

  syncAi(): void {
    this.syncing = true;
    this.aiAssistantService.getInsights().subscribe({
      next: (snapshot) => {
        this.aiSnapshot = snapshot;
        this.metrics = this.buildMetrics(
          this.barChartData.labels?.map((l, i) => ({
            month: String(l),
            total: (this.barChartData.datasets[0].data[i] as number) ?? 0,
          })) ?? [],
          this.recentReceipts,
          this.budgetStatus,
          snapshot,
        );
        this.syncing = false;
      },
      error: () => {
        this.syncing = false;
      },
    });
  }

  ngOnInit(): void {
    forkJoin({
      monthly: this.analyticsService
        .getMonthlySpendings(6)
        .pipe(catchError(() => of<MonthlySpendingItem[]>([]))),
      category: this.analyticsService
        .getCategoryBreakdown()
        .pipe(catchError(() => of<CategorySpendItem[]>([]))),
      receiptFeed: this.receiptService
        .getReceipts({ page: 1, pageSize: 60 })
        .pipe(
          catchError(() =>
            of<PaginatedResponse<ReceiptDto>>({ total: 0, data: [] }),
          ),
        ),
      budgetStatus: this.budgetService
        .getBudgetStatus()
        .pipe(catchError(() => of<BudgetStatus | null>(null))),
      aiSnapshot: this.aiAssistantService
        .getInsights()
        .pipe(catchError(() => of<AiInsightSnapshot | null>(null))),
    }).subscribe({
      next: ({ monthly, category, receiptFeed, budgetStatus, aiSnapshot }) => {
        const recentReceipts = receiptFeed.data.slice(0, 5);

        this.barChartData = {
          labels: monthly.map((item) => item.month),
          datasets: [
            {
              data: monthly.map((item) => item.total),
              label: 'Monthly spending',
              backgroundColor: '#0f6c5b',
              borderRadius: 10,
            },
          ],
        };

        this.pieChartData = {
          labels: category.map((item) => item.category),
          datasets: [
            {
              data: category.map((item) => item.total),
              backgroundColor: [
                '#0f6c5b',
                '#18a8c1',
                '#ffb25b',
                '#f16b4e',
                '#607d8b',
              ],
            },
          ],
        };

        this.topCategory = category.length
          ? [...category].sort((left, right) => right.total - left.total)[0]
              .category
          : 'N/A';
        this.recentReceipts = recentReceipts;
        this.calendarReceipts = receiptFeed.data;
        this.budgetStatus = budgetStatus;
        this.aiSnapshot = aiSnapshot;
        this.metrics = this.buildMetrics(
          monthly,
          recentReceipts,
          budgetStatus,
          aiSnapshot,
        );
        this.loading = false;
      },
      error: () => {
        this.loadError = 'We could not load your dashboard right now.';
        this.loading = false;
      },
    });
  }

  private buildMetrics(
    monthly: MonthlySpendingItem[],
    recentReceipts: ReceiptDto[],
    budgetStatus: BudgetStatus | null,
    aiSnapshot: AiInsightSnapshot | null,
  ): DashboardMetricCard[] {
    const totalSpend = monthly.reduce((sum, item) => sum + item.total, 0);
    const averageSpend = monthly.length ? totalSpend / monthly.length : 0;
    const recentTotal = recentReceipts.reduce(
      (sum, item) => sum + item.totalAmount,
      0,
    );
    const budgetRatio = budgetStatus?.budget
      ? budgetStatus.spent / budgetStatus.budget
      : 0;

    return [
      {
        label: '6-month spend',
        value: `$${totalSpend.toFixed(0)}`,
        detail: `${monthly.length || 0} tracked months`,
        tone: 'default',
      },
      {
        label: 'Average month',
        value: `$${averageSpend.toFixed(0)}`,
        detail: aiSnapshot?.budgetHealth || 'AI summary pending',
        tone: 'positive',
      },
      {
        label: 'Recent receipts',
        value: `${recentReceipts.length}`,
        detail: `$${recentTotal.toFixed(0)} in latest uploads`,
        tone: 'default',
      },
      {
        label: 'Budget used',
        value: budgetStatus?.budget
          ? `${Math.min(budgetRatio * 100, 999).toFixed(0)}%`
          : 'N/A',
        detail: budgetStatus?.message || 'Add a budget to unlock alerts',
        tone: budgetRatio >= 1 ? 'warning' : 'positive',
      },
    ];
  }
}
