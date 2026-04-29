import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProcessInstance } from '../interfaces/process.interface';
import { environment } from '../config/env';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/process`;

  startProcess(projectId: string): Observable<ProcessInstance> {
    return this.http.post<ProcessInstance>(`${this.apiUrl}/start/${projectId}`, {});
  }

  advanceProcess(instanceId: string, data: any): Observable<ProcessInstance> {
    return this.http.post<ProcessInstance>(`${this.apiUrl}/${instanceId}/advance`, data);
  }

  getMyProcesses(): Observable<ProcessInstance[]> {
    return this.http.get<ProcessInstance[]>(`${this.apiUrl}/my-processes`);
  }
}
