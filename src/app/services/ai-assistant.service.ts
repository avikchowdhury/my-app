import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';
import {
  AiChatRequest,
  AiChatResponse,
  AiInsightSnapshot,
  AiSubscriptionInsight,
} from '../models';
import {
  ExpenseCurrencyCode,
  LocalePreferenceService,
} from './locale-preference.service';

const API_BASE = '/api';
const DEFAULT_CACHE_TTL_MS = 20_000;

interface CacheEntry<T> {
  expiresAt: number;
  value$: Observable<T>;
}

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  constructor(
    private http: HttpClient,
    private localePreference: LocalePreferenceService,
  ) {}

  private readonly requestCache = new Map<string, CacheEntry<unknown>>();

  getInsights(forceRefresh = false): Observable<AiInsightSnapshot> {
    return this.getCached(
      'ai-insights',
      () => this.http.get<AiInsightSnapshot>(`${API_BASE}/ai/insights`),
      forceRefresh,
    );
  }

  getSubscriptions(forceRefresh = false): Observable<AiSubscriptionInsight[]> {
    return this.getCached(
      'ai-subscriptions',
      () =>
        this.http.get<AiSubscriptionInsight[]>(
          `${API_BASE}/ai/subscriptions`,
        ),
      forceRefresh,
      60_000,
    );
  }

  sendMessage(payload: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${API_BASE}/ai/chat`, {
      ...payload,
      message: this.buildFlexibleChatMessage(payload.message),
    });
  }

  getSpendingAnomalies(forceRefresh = false): Observable<SpendingAnomaly[]> {
    return this.getCached(
      'ai-anomalies',
      () =>
        this.http.get<SpendingAnomaly[]>(`${API_BASE}/ai/spending-anomalies`),
      forceRefresh,
    );
  }

  getMonthlySummary(forceRefresh = false): Observable<MonthlySummary> {
    return this.getCached(
      'ai-monthly-summary',
      () => this.http.get<MonthlySummary>(`${API_BASE}/ai/monthly-summary`),
      forceRefresh,
    );
  }

  getForecast(forceRefresh = false): Observable<SpendingForecast> {
    return this.getCached(
      'ai-forecast',
      () => this.http.get<SpendingForecast>(`${API_BASE}/ai/forecast`),
      forceRefresh,
      15_000,
    );
  }

  getWhatIfForecast(
    adjustments: ForecastAdjustment[],
  ): Observable<WhatIfForecast> {
    return this.http.post<WhatIfForecast>(`${API_BASE}/ai/forecast/what-if`, {
      adjustments,
    });
  }

  getWeeklySummary(forceRefresh = false): Observable<WeeklySummary> {
    return this.getCached(
      'ai-weekly-summary',
      () => this.http.get<WeeklySummary>(`${API_BASE}/ai/weekly-summary`),
      forceRefresh,
      60_000,
    );
  }

  getNotifications(forceRefresh = false): Observable<AppNotification[]> {
    return this.getCached(
      'ai-notifications',
      () => this.http.get<AppNotification[]>(`${API_BASE}/notifications`),
      forceRefresh,
      15_000,
    );
  }

  parseTextExpense(text: string): Observable<ParseTextResult> {
    const sourceText = text.trim();
    const detectedCurrency =
      this.localePreference.detectExplicitExpenseCurrency(sourceText);

    return this.http
      .post<ParseTextResult>(`${API_BASE}/ai/parse-text`, {
        text: this.localePreference.buildCurrencyAwareExpenseText(sourceText),
      })
      .pipe(
        map((result) => ({
          ...result,
          rawText: sourceText,
          detectedCurrency,
          amount:
            typeof result.amount === 'number'
              ? this.localePreference.normalizeExplicitCurrencyToBase(
                  result.amount,
                  detectedCurrency,
                )
              : result.amount,
        })),
      );
  }

  getVendorAnalysis(forceRefresh = false): Observable<VendorAnalysis> {
    return this.getCached(
      'ai-vendor-analysis',
      () => this.http.get<VendorAnalysis>(`${API_BASE}/ai/vendor-analysis`),
      forceRefresh,
      30_000,
    );
  }

  checkDuplicate(
    vendor: string,
    amount: number,
    date: string,
  ): Observable<DuplicateCheckResult> {
    return this.http.post<DuplicateCheckResult>(
      `${API_BASE}/ai/check-duplicate`,
      { vendor, amount, date },
    );
  }

  exportAiReport(): void {
    this.http
      .get(`${API_BASE}/export/report`, { responseType: 'blob' })
      .subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-expense-report.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
  }

  invalidateInsightCache(): void {
    this.clearCache(
      'ai-insights',
      'ai-subscriptions',
      'ai-anomalies',
      'ai-monthly-summary',
      'ai-forecast',
      'ai-weekly-summary',
      'ai-notifications',
      'ai-vendor-analysis',
    );
  }

  private getCached<T>(
    key: string,
    requestFactory: () => Observable<T>,
    forceRefresh = false,
    ttlMs = DEFAULT_CACHE_TTL_MS,
  ): Observable<T> {
    const now = Date.now();
    const cached = this.requestCache.get(key) as CacheEntry<T> | undefined;
    if (!forceRefresh && cached && cached.expiresAt > now) {
      return cached.value$;
    }

    const value$ = requestFactory().pipe(
      tap({
        error: () => this.requestCache.delete(key),
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.requestCache.set(key, {
      expiresAt: now + ttlMs,
      value$,
    });

    return value$;
  }

  private clearCache(...keys: string[]): void {
    keys.forEach((key) => this.requestCache.delete(key));
  }

  private buildFlexibleChatMessage(message: string): string {
    const trimmedMessage = message.trim();
    const preference = this.localePreference.currentPreference;

    return [
      `User request: ${trimmedMessage}`,
      `Assistant guidance: Answer using the user's real expense tracker data whenever possible. If the request is open-ended, comparative, hypothetical, or slightly outside the recorded facts, still help by stating assumptions, grounding the answer in known budgets, receipts, categories, and alerts, and suggesting the best tracker-based next step. Use ${preference.currencyCode} and ${preference.languageLabel} conventions when mentioning money.`,
    ].join('\n\n');
  }
}

export interface SpendingAnomaly {
  category: string;
  thisMonth: number;
  averageMonth: number;
  percentageIncrease: number;
  severity: 'normal' | 'warning' | 'critical';
  message: string;
}

export interface MonthlySummary {
  month: string;
  totalSpend: number;
  topCategory: string;
  receiptCount: number;
  aiSummary: string;
  anomalies: SpendingAnomaly[];
}

export interface DailySpendPoint {
  date: string;
  amount: number;
  isProjected: boolean;
}

export interface SpendingForecast {
  currentSpend: number;
  projectedMonthEnd: number;
  dailyAverage: number;
  daysElapsed: number;
  daysRemaining: number;
  trend: 'on-track' | 'warning' | 'critical';
  aiNarrative: string;
  budgetAmount: number;
  topCategory: string;
  drivers: ForecastDriver[];
  dailyBreakdown: DailySpendPoint[];
}

export interface ForecastDriver {
  category: string;
  amount: number;
}

export interface ForecastAdjustment {
  category: string;
  deltaAmount: number;
}

export interface WhatIfForecast {
  baseProjectedMonthEnd: number;
  adjustedProjectedMonthEnd: number;
  netChange: number;
  trend: 'on-track' | 'warning' | 'critical';
  summary: string;
  adjustments: ForecastAdjustment[];
}

export interface WeeklyCategorySpend {
  category: string;
  totalSpend: number;
}

export interface WeeklySummary {
  rangeLabel: string;
  totalSpend: number;
  receiptCount: number;
  topCategory: string;
  forecastRisk: string;
  recommendation: string;
  topCategories: WeeklyCategorySpend[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'budget' | 'anomaly' | 'subscription' | 'info';
  severity: 'info' | 'warning' | 'critical';
  generatedAt: string;
}

export interface ParseTextResult {
  vendor: string;
  amount: number;
  category: string;
  date: string;
  parsed: boolean;
  rawText: string;
  detectedCurrency?: ExpenseCurrencyCode | null;
}

export interface VendorSummary {
  vendor: string;
  totalSpend: number;
  visitCount: number;
  averageTransaction: number;
  changePercent: number | null;
  trend: 'up' | 'down' | 'steady' | 'new';
}

export interface VendorAnalysis {
  month: string;
  topVendors: VendorSummary[];
  aiObservation: string;
}

export interface ReceiptMatch {
  id: number;
  vendor: string;
  amount: number;
  date: string;
  matchReason: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  warning: string;
  potentialMatches: ReceiptMatch[];
}
