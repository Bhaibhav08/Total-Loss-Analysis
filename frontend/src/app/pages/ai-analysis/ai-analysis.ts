import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Api, InvestigationData, AavaWorkflowResult } from '../../core/services/api';

@Component({
  selector: 'app-ai-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-analysis.html',
  styleUrl: './ai-analysis.css'
})
export class AiAnalysis implements OnInit {
  activeTab: 'store' | 'upload' = 'store';
  storeId: string = 'S012'; // Default target store
  storesList: InvestigationData[] = [];

  // Custom uploaded file state
  uploadedFileName: string | null = null;
  uploadedCsvContent: string | null = null;
  uploadedRowCount: number = 0;
  csvPreviewLines: string[] = [];

  // Execution State
  loading: boolean = false;
  currentStep: number = 1;
  workflowExecutionId: string | null = null;
  error: string | null = null;

  // Analysis Result
  workflowResult: AavaWorkflowResult | null = null;
  rawMarkdown: string = '';
  renderedHtml: SafeHtml = '';
  copiedToast: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: Api,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load stores list
    this.api.getInvestigations().pipe(catchError(() => of(null))).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.storesList = res.data;
          this.cdr.detectChanges();
        }
      }
    });

    this.route.params.subscribe(params => {
      if (params['storeId']) {
        this.storeId = params['storeId'];
        this.activeTab = 'store';
      }
      this.runAnalysis();
    });
  }

  setTab(tab: 'store' | 'upload'): void {
    this.activeTab = tab;
    this.error = null;
  }

  onStoreChange(): void {
    if (this.storeId) {
      this.router.navigate(['/ai-analysis', this.storeId]);
    }
  }

  // Handle custom CSV File Upload
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processFile(file);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.processFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private processFile(file: File): void {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      this.error = 'Please upload a valid .csv file.';
      return;
    }

    this.uploadedFileName = file.name;
    this.error = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.uploadedCsvContent = text;
      const lines = text.trim().split('\n');
      this.uploadedRowCount = Math.max(0, lines.length - 1);
      this.csvPreviewLines = lines.slice(0, 6);
      this.cdr.detectChanges();
    };
    reader.readAsText(file);
  }

  // Run the AAVA workflow execution
  runAnalysis(): void {
    this.loading = true;
    this.error = null;
    this.workflowResult = null;
    this.workflowExecutionId = null;
    this.currentStep = 1;

    const payload: { storeId?: string; csvContent?: string } = {};

    if (this.activeTab === 'upload') {
      if (!this.uploadedCsvContent) {
        this.error = 'Please upload a CSV file before running analysis.';
        this.loading = false;
        return;
      }
      payload.csvContent = this.uploadedCsvContent;
    } else {
      payload.storeId = this.storeId;
    }

    // Step 2: Submitting payload to workflow
    setTimeout(() => {
      this.currentStep = 2;
      this.cdr.detectChanges();
    }, 600);

    this.api.executeAavaWorkflow(payload).pipe(
      catchError((err) => {
        console.error('Workflow error:', err);
        this.error = err.error?.message || 'Unable to complete AAVA workflow analysis. Backend service fallback engaged.';
        this.loading = false;
        this.cdr.detectChanges();
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.workflowResult = response.data;
          this.workflowExecutionId = response.data.workflowExecutionId;
          this.rawMarkdown = response.data.markdown || '';
          this.renderedHtml = this.parseMarkdownToHtml(this.rawMarkdown);
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  copyMarkdown(): void {
    if (!this.rawMarkdown) return;
    navigator.clipboard.writeText(this.rawMarkdown).then(() => {
      this.copiedToast = true;
      setTimeout(() => {
        this.copiedToast = false;
        this.cdr.detectChanges();
      }, 3000);
      this.cdr.detectChanges();
    });
  }

  printBrief(): void {
    window.print();
  }

  // Lightweight markdown to styled HTML converter
  private parseMarkdownToHtml(md: string): SafeHtml {
    if (!md) return '';

    let html = md;

    // Escape HTML entities to prevent injection
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Tables parsing: convert markdown tables to HTML tables
    const tableRegex = /((?:\|[^\n]+\|\n?)+)/g;
    html = html.replace(tableRegex, (match) => {
      const rows = match.trim().split('\n');
      if (rows.length < 2) return match;

      let tableHtml = '<div class="table-wrap"><table class="brief-table">';
      
      rows.forEach((row, index) => {
        // Skip markdown separator row like |---|---|
        if (/^\|[\s\-:|]+\|$/.test(row.trim())) return;

        const cells = row.split('|').slice(1, -1).map(c => c.trim());
        if (index === 0) {
          tableHtml += '<thead><tr>';
          cells.forEach(c => tableHtml += `<th>${this.formatInline(c)}</th>`);
          tableHtml += '</tr></thead><tbody>';
        } else {
          tableHtml += '<tr>';
          cells.forEach(c => tableHtml += `<td>${this.formatInline(c)}</td>`);
          tableHtml += '</tr>';
        }
      });

      tableHtml += '</tbody></table></div>';
      return tableHtml;
    });

    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1 class="brief-h1">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="brief-h2">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="brief-h3">$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4 class="brief-h4">$1</h4>');

    // Horizontal Rules
    html = html.replace(/^---$/gim, '<hr class="brief-divider"/>');

    // Blockquotes / Alerts
    html = html.replace(/^> (.*$)/gim, '<blockquote class="brief-quote">$1</blockquote>');

    // Unordered lists
    html = html.replace(/^\- (.*$)/gim, '<li class="brief-bullet">$1</li>');
    html = html.replace(/((?:<li class="brief-bullet">.*<\/li>\n?)+)/g, '<ul class="brief-ul">$1</ul>');

    // Numbered lists
    html = html.replace(/^\d+\.\s+(.*$)/gim, '<li class="brief-num-item">$1</li>');
    html = html.replace(/((?:<li class="brief-num-item">.*<\/li>\n?)+)/g, '<ol class="brief-ol">$1</ol>');

    // Inline bold, italic, code
    html = this.formatInline(html);

    // Paragraphs
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<blockquote') || p.startsWith('<hr')) {
        return p;
      }
      return `<p class="brief-p">${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private formatInline(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="brief-code">$1</code>');
  }
}
