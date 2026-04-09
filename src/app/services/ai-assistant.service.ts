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
    return this.http.get<AiSubscriptionInsight[]>(`${API_BASE}/ai/subscriptions`);
  }

  sendMessage(payload: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${API_BASE}/ai/chat`, payload);
  }

  getSpendingAnomalies(): Observable<SpendingAnomaly[]> {
    return this.http.get<SpendingAnomaly[]>(`${API_BASE}/ai/spending-anomalies`);
  }

  getMonthlySummary(): Observable<MonthlySummary> {
    return this.http.get<MonthlySummary>(`${API_BASE}/ai/monthly-summary`);
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
