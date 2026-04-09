import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AiInsightSnapshot, AiSubscriptionInsight } from '../../../models';
import {
  AiAssistantService,
  MonthlySummary,
  SpendingAnomaly,
  VendorAnalysis,
} from '../../../services/ai-assistant.service';

type InsightsTab = 'overview' | 'subscriptions' | 'anomalies' | 'vendors';

@Component({
  selector: 'app-insights-page',
  templateUrl: './insights-page.component.html',
  styleUrls: ['./insights-page.component.scss'],
})
export class InsightsPageComponent implements OnInit {
  activeTab: InsightsTab = 'overview';

  loading = true;
  loadError = false;

  snapshot: AiInsightSnapshot | null = null;
  monthlySummary: MonthlySummary | null = null;
  subscriptions: AiSubscriptionInsight[] = [];
  anomalies: SpendingAnomaly[] = [];

  vendorAnalysis: VendorAnalysis | null = null;
  vendorLoading = false;

  // Ask-the-AI section
  aiPrompt = '';
  aiResponse = '';
  aiThinking = false;

  readonly quickPrompts = [
    'What is my biggest financial risk this month?',
    'Which subscriptions can I safely cancel?',
    'How does my spending compare to last month?',
    'Give me a 3-step plan to cut my spending by 15%.',
    'Am I likely to exceed my budget this month?',
  ];

  constructor(private aiService: AiAssistantService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading = true;
    this.loadError = false;

    forkJoin({
      snapshot: this.aiService.getInsights(),
      summary: this.aiService.getMonthlySummary(),
      subscriptions: this.aiService.getSubscriptions(),
    }).subscribe({
      next: ({ snapshot, summary, subscriptions }) => {
        this.snapshot = snapshot;
        this.monthlySummary = summary;
        this.anomalies = summary.anomalies ?? [];
        this.subscriptions = subscriptions;
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      },
    });
  }

  setTab(tab: InsightsTab): void {
    this.activeTab = tab;
    if (tab === 'vendors' && !this.vendorAnalysis && !this.vendorLoading) {
      this.loadVendors();
    }
  }

  loadVendors(): void {
    this.vendorLoading = true;
    this.aiService.getVendorAnalysis().subscribe({
      next: (v) => {
        this.vendorAnalysis = v;
        this.vendorLoading = false;
      },
      error: () => {
        this.vendorLoading = false;
      },
    });
  }

  downloadReport(): void {
    this.aiService.exportAiReport();
  }

  trendIcon(trend: string): string {
    if (trend === 'up') return 'trending_up';
    if (trend === 'down') return 'trending_down';
    if (trend === 'new') return 'fiber_new';
    return 'trending_flat';
  }

  reload(): void {
    this.vendorAnalysis = null;
    this.loadAll();
  }

  askAi(): void {
    const message = this.aiPrompt.trim();
    if (!message || this.aiThinking) return;

    this.aiThinking = true;
    this.aiResponse = '';

    this.aiService.sendMessage({ message }).subscribe({
      next: (res) => {
        this.aiResponse = res.reply;
        this.aiThinking = false;
      },
      error: () => {
        this.aiResponse = 'Could not reach the AI right now. Please try again.';
        this.aiThinking = false;
      },
    });
  }

  useQuickPrompt(prompt: string): void {
    this.aiPrompt = prompt;
    this.askAi();
  }

  askAnomalyWhy(a: SpendingAnomaly): void {
    const pct = Math.round(a.percentageIncrease);
    this.useQuickPrompt(
      `Why is my ${a.category} spending up ${pct}% and how do I fix it?`,
    );
  }

  get healthColor(): string {
    const h = this.snapshot?.budgetHealth?.toLowerCase() ?? '';
    if (h.includes('critical') || h.includes('over')) return 'critical';
    if (h.includes('warning') || h.includes('watch')) return 'warning';
    return 'positive';
  }

  get severityIcon(): Record<string, string> {
    return {
      critical: 'error',
      warning: 'warning_amber',
      positive: 'check_circle',
      info: 'info',
    };
  }
}
