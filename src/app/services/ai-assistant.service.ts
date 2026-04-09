import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AiChatRequest,
  AiChatResponse,
  AiInsightSnapshot,
  AiSubscriptionInsight,
} from '../models';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  constructor(private http: HttpClient) {}

  getInsights(): Observable<AiInsightSnapshot> {
    return this.http.get<AiInsightSnapshot>(`${API_BASE}/ai/insights`);
  }

  getSubscriptions(): Observable<AiSubscriptionInsight[]> {
    return this.http.get<AiSubscriptionInsight[]>(
      `${API_BASE}/ai/subscriptions`,
    );
  }

  sendMessage(payload: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${API_BASE}/ai/chat`, payload);
  }

  getSpendingAnomalies(): Observable<SpendingAnomaly[]> {
    return this.http.get<SpendingAnomaly[]>(
      `${API_BASE}/ai/spending-anomalies`,
    );
  }

  getMonthlySummary(): Observable<MonthlySummary> {
    return this.http.get<MonthlySummary>(`${API_BASE}/ai/monthly-summary`);
  }

  getForecast(): Observable<SpendingForecast> {
    return this.http.get<SpendingForecast>(`${API_BASE}/ai/forecast`);
  }

  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${API_BASE}/notifications`);
  }

  parseTextExpense(text: string): Observable<ParseTextResult> {
    return this.http.post<ParseTextResult>(`${API_BASE}/ai/parse-text`, {
      text,
    });
  }

  getVendorAnalysis(): Observable<VendorAnalysis> {
    return this.http.get<VendorAnalysis>(`${API_BASE}/ai/vendor-analysis`);
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
  dailyBreakdown: DailySpendPoint[];
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
