import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analysis-result.html',
  styleUrl: './analysis-result.css'
})
export class AnalysisResultComponent {
  public result = input<any>();
  public close = output<void>();

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 50) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  }
}
