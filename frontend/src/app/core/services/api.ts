import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}

export interface BaselineData {
  average_return_rate: number;
  average_refund_rate: number;
  average_shrinkage: number;
  stores_analyzed: number;
}

export interface DashboardSummary {
  total_loss: number;
  loss_breakdown: {
    returns: number;
    refunds: number;
    shrinkage: number;
  };
  counts: {
    stores: number;
    products: number;
    transactions: number;
    inventory_records: number;
  };
  top_loss_stores: Array<{
    store_id: string;
    store_name: string;
    loss: number;
  }>;
  top_return_products: Array<{
    product_id: string;
    product_name: string;
    category: string;
    return_count: number;
    return_value: number;
  }>;
}

export interface InvestigationData {
  store_id: string;
  store_name: string;
  region: string;
  risk_score: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  total_loss: number;
  loss_breakdown: {
    returns: number;
    refunds: number;
    shrinkage: number;
  };
  metrics: {
    total_transactions: number;
    return_count: number;
    refund_count: number;
    return_rate: number;
    refund_rate: number;
    discrepancy_quantity: number;
  };
  reasons: string[];
  recommended_actions: string[];
}

export interface AIContextData {
  analysis_type: string;
  store: {
    store_id: string;
    store_name: string;
    region: string;
  };
  financial_impact: {
    total_loss: number;
    return_loss: number;
    refund_loss: number;
    shrinkage_loss: number;
  };
  transaction_metrics: {
    total_transactions: number;
    return_count: number;
    refund_count: number;
    return_rate: number;
    refund_rate: number;
  };
  inventory_metrics: {
    discrepancy_quantity: number;
    discrepancy_value: number;
  };
  top_returned_products: Array<{
    product_id: string;
    product_name: string;
    category: string;
    return_count: number;
    return_value: number;
  }>;
  employee_patterns: Array<{
    employee_id: string;
    transactions: number;
    returns: number;
    refunds: number;
  }>;
  instruction: string;
}

export interface AavaWorkflowResult {
  is_mock: boolean;
  model: string;
  workflowExecutionId: string;
  generated_at: string;
  markdown: string;
}

export interface AIAnalysisResult {
  is_mock?: boolean;
  model?: string;
  workflowExecutionId?: string;
  generated_at?: string;
  markdown?: string;
  store?: {
    store_id: string;
    store_name: string;
    region: string;
  };
  executive_summary?: {
    assessment: string;
    risk_level: string;
  };
  facts?: {
    total_loss: number;
    return_loss: number;
    refund_loss: number;
    shrinkage_loss: number;
    return_rate: number;
    refund_rate: number;
    total_transactions: number;
    discrepancy_quantity: number;
  };
  ai_interpretation?: {
    primary_driver: string;
    analysis: string;
    employee_signal: string;
  };
  risk_drivers?: Array<{
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    observation: string;
    impact: string;
  }>;
  top_returned_products?: Array<{
    product_id: string;
    product_name: string;
    category: string;
    return_count: number;
    return_value: number;
  }>;
  employee_patterns?: Array<{
    employee_id: string;
    transactions: number;
    returns: number;
    refunds: number;
  }>;
  recommended_actions?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class Api {
  public baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : '/api';

  constructor(private http: HttpClient) {}

  getBaseline(): Observable<ApiResponse<BaselineData>> {
    return this.http.get<ApiResponse<BaselineData>>(`${this.baseUrl}/baseline`);
  }

  getDashboard(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.baseUrl}/dashboard`);
  }

  getInvestigations(): Observable<ApiResponse<InvestigationData[]>> {
    return this.http.get<ApiResponse<InvestigationData[]>>(`${this.baseUrl}/investigations`);
  }

  getInvestigationByStore(storeId: string): Observable<ApiResponse<InvestigationData>> {
    return this.http.get<ApiResponse<InvestigationData>>(`${this.baseUrl}/investigations/${storeId}`);
  }

  getAIContext(storeId: string): Observable<ApiResponse<AIContextData>> {
    return this.http.get<ApiResponse<AIContextData>>(`${this.baseUrl}/ai/context/${storeId}`);
  }

  analyzeStoreWithAI(storeId: string): Observable<ApiResponse<AIAnalysisResult>> {
    return this.http.post<ApiResponse<AIAnalysisResult>>(`${this.baseUrl}/ai/analyze/${storeId}`, {});
  }

  executeAavaWorkflow(params: { storeId?: string; csvContent?: string }): Observable<ApiResponse<AavaWorkflowResult>> {
    return this.http.post<ApiResponse<AavaWorkflowResult>>(`${this.baseUrl}/ai/workflow/analyze`, params);
  }

  getTransactions(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/data/transactions`);
  }

  getInventory(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/data/inventory`);
  }

  getProducts(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/data/products`);
  }
}