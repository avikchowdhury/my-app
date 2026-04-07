import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  PaginatedResponse,
  ReceiptAiParseResult,
  ReceiptDto,
  ReceiptQueryParams,
} from '../models';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  constructor(private http: HttpClient) {}

  private buildParams(query: ReceiptQueryParams): HttpParams {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.trim() !== '') {
        params = params.set(key, `${value}`);
      }
    });

    return params;
  }

  updateReceipt(id: number, data: Partial<ReceiptDto>): Observable<ReceiptDto> {
    return this.http.put<ReceiptDto>(`${API_BASE}/receipts/${id}`, data);
  }

  deleteReceipt(id: number): Observable<any> {
    return this.http.delete(`${API_BASE}/receipts/${id}`);
  }

  parseReceiptAI(file: File): Observable<ReceiptAiParseResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ReceiptAiParseResult>(
      `${API_BASE}/ai/parse-receipt`,
      formData,
    );
  }

  uploadReceipt(
    file: File,
    metadata?: { category?: string; notes?: string },
  ): Observable<ReceiptDto> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.category) {
      formData.append('category', metadata.category);
    }
    if (metadata?.notes) {
      formData.append('notes', metadata.notes);
    }
    return this.http.post<ReceiptDto>(`${API_BASE}/receipts`, formData);
  }

  getReceipts(
    query: ReceiptQueryParams = {},
  ): Observable<PaginatedResponse<ReceiptDto>> {
    return this.http.get<PaginatedResponse<ReceiptDto>>(
      `${API_BASE}/receipts`,
      {
        params: this.buildParams(query),
      },
    );
  }

  getRecentReceipts(limit: number = 5): Observable<ReceiptDto[]> {
    return this.getReceipts({ page: 1, pageSize: limit }).pipe(
      map((response) => response.data.slice(0, limit)),
    );
  }
}
