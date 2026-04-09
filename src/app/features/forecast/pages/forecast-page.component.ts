import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import {
  AiAssistantService,
  DailySpendPoint,
  SpendingForecast,
} from '../../../services/ai-assistant.service';

interface ForecastBarPoint extends DailySpendPoint {
  barHeight: number;
}

@Component({
  selector: 'app-forecast-page',
  templateUrl: './forecast-page.component.html',
  styleUrls: ['./forecast-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForecastPageComponent implements OnInit {
  forecast: SpendingForecast | null = null;
  chartDays: ForecastBarPoint[] = [];
  loading = true;
  loadError = false;

  constructor(
    private aiService: AiAssistantService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(forceRefresh = false): void {
    this.loading = true;
    this.loadError = false;
    this.cdr.markForCheck();

    this.aiService.getForecast(forceRefresh).subscribe({
      next: (f) => {
        this.setForecast(f);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError = true;
        this.forecast = null;
        this.chartDays = [];
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  trackDay(_: number, day: ForecastBarPoint): string {
    return day.date;
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

  private setForecast(forecast: SpendingForecast): void {
    const maxBarAmount = Math.max(
      ...forecast.dailyBreakdown.map((day) => day.amount),
      1,
    );

    this.forecast = forecast;
    this.chartDays = forecast.dailyBreakdown.map((day) => ({
      ...day,
      barHeight: Math.min(
        100,
        Math.round((day.amount / maxBarAmount) * 100),
      ),
    }));
  }
}
