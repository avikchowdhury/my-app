import { Component, OnInit } from '@angular/core';
import {
  AiAssistantService,
  DailySpendPoint,
  SpendingForecast,
} from '../../../services/ai-assistant.service';

@Component({
  selector: 'app-forecast-page',
  templateUrl: './forecast-page.component.html',
  styleUrls: ['./forecast-page.component.scss'],
})
export class ForecastPageComponent implements OnInit {
  forecast: SpendingForecast | null = null;
  loading = true;
  loadError = false;

  constructor(private aiService: AiAssistantService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.aiService.getForecast().subscribe({
      next: (f) => {
        this.forecast = f;
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      },
    });
  }

  get actualDays(): DailySpendPoint[] {
    return this.forecast?.dailyBreakdown.filter((d) => !d.isProjected) ?? [];
  }

  get projectedDays(): DailySpendPoint[] {
    return this.forecast?.dailyBreakdown.filter((d) => d.isProjected) ?? [];
  }

  get maxBarAmount(): number {
    const all = this.forecast?.dailyBreakdown ?? [];
    return Math.max(...all.map((d) => d.amount), 1);
  }

  barHeight(amount: number): number {
    return Math.min(100, Math.round((amount / this.maxBarAmount) * 100));
  }

  get trendClass(): string {
    return this.forecast?.trend ?? 'on-track';
  }

  get trendLabel(): string {
    const t = this.forecast?.trend;
    if (t === 'critical') return 'Over budget pace';
    if (t === 'warning') return 'Approaching limit';
    return 'On track';
  }

  get trendIcon(): string {
    const t = this.forecast?.trend;
    if (t === 'critical') return 'trending_up';
    if (t === 'warning') return 'warning_amber';
    return 'check_circle';
  }
}
