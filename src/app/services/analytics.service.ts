import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CategorySpendItem, MonthlySpendingItem } from '../models';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private http: HttpClient) {}

  getMonthlySpendings(months: number = 6): Observable<MonthlySpendingItem[]> {
    return this.http.get<MonthlySpendingItem[]>(
      `${API_BASE}/analytics/monthly?months=${months}`,
    );
  }

  getCategoryBreakdown(): Observable<CategorySpendItem[]> {
    return this.http.get<CategorySpendItem[]>(`${API_BASE}/analytics/category`);
  }
}
