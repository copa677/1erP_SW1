import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../services/project.service';
import { Project } from '../interfaces/project.interface';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../services/notification.service';
import { UsersMgmtComponent } from './users-mgmt/users-mgmt.component';
import { AssignmentsComponent } from './assignments/assignments.component';
import { ProcessExecutionComponent } from './process-execution/process-execution.component';
import { WorkflowService } from '../services/workflow.service';
import { OnboardingService } from '../services/onboarding.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    UsersMgmtComponent, 
    AssignmentsComponent,
    ProcessExecutionComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  public projectService = inject(ProjectService);
  public authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private workflowService = inject(WorkflowService);
  private onboardingService = inject(OnboardingService);

  // Vistas: 'kpis' | 'projects' | 'users' | 'assignments' | 'execution'
  currentView = signal<string>('kpis');

  showCreateModal = signal<boolean>(false);
  showJoinModal = signal<boolean>(false);
  newProjectName = '';
  newProjectDescription = '';
  joinProjectId = '';

  setView(view: string) {
    this.currentView.set(view);
  }

  // KPIs Data
  public stats = signal({
    totalProjects: 0,
    totalExecutions: 0,
    successRate: 0,
    bottlenecksDetected: 0,
    activeUsers: 0,
    statusDistribution: { completed: 0, active: 0, failed: 0 },
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0] // Ultimos 7 días
  });

  ngOnInit() {
    this.loadStats();
    this.onboardingService.startTour();
  }

  private loadStats() {
    this.projectService.loadProjects().subscribe({
      next: (projects) => {
        this.calculateStats(projects);
      },
      error: (err) => console.error('Error loading projects', err)
    });
    
    this.workflowService.getMyProcesses().subscribe(processes => {
      this.calculateWorkflowStats(processes);
    });
  }

  private calculateStats(projects: Project[]) {
    this.stats.update(s => ({
      ...s,
      totalProjects: projects.length,
      activeUsers: new Set(projects.flatMap(p => p.collaboratorIds || [])).size + 1
    }));
  }

  private calculateWorkflowStats(processes: any[]) {
    if (!processes || !Array.isArray(processes)) return;
    
    const total = processes.length;
    const completed = processes.filter(p => p.status === 'COMPLETED').length;
    const active = processes.filter(p => p.status === 'ACTIVE' || p.status === 'STARTED').length;
    const failed = processes.filter(p => p.status === 'FAILED' || p.status === 'CANCELLED').length;
    
    // Simulación de actividad semanal
    const weekly = [12, 19, 3, 5, 2, 3, total > 0 ? total : 0];

    const bottlenecks = processes.reduce((acc, p) => {
      const slowSteps = p.history?.filter((h: any) => h.duration > 5000) || [];
      return acc + slowSteps.length;
    }, 0);

    this.stats.update(s => ({
      ...s,
      totalExecutions: total,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      bottlenecksDetected: bottlenecks,
      statusDistribution: { completed, active, failed },
      weeklyActivity: weekly
    }));
  }

  joinProject() {
    if (this.joinProjectId.trim()) {
      this.projectService.joinProject(this.joinProjectId.trim()).subscribe({
        next: (project) => {
          this.notificationService.success(`Te has unido al proyecto: ${project.name}`);
          this.showJoinModal.set(false);
          this.joinProjectId = '';
        },
        error: (err) => {
          const errMsg = err.error?.message || 'ID de proyecto inválido o ya eres colaborador';
          this.notificationService.error(errMsg);
        }
      });
    }
  }

  createNewProject() {
    if (this.newProjectName.trim()) {
      this.projectService.createProject(this.newProjectName, this.newProjectDescription).subscribe({
        next: (project) => {
          this.notificationService.success('Proyecto creado correctamente');
          this.router.navigate(['/editor', project.id]);
        },
        error: (err) => {
          this.notificationService.error('Error al crear el proyecto');
          console.error('Error creating project', err);
        }
      });
    }
  }

  async deleteProject(event: Event, id: string | undefined) {
    event.stopPropagation();
    if (!id) return;

    const confirmed = await this.notificationService.confirm(
      '¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.',
      'Eliminar Proyecto',
      'Eliminar Proyecto',
      'Cancelar',
      'danger'
    );

    if (confirmed) {
      this.projectService.deleteProject(id).subscribe({
        next: () => this.notificationService.success('Proyecto eliminado'),
        error: (err) => {
          this.notificationService.error('Error al eliminar el proyecto');
          console.error('Error deleting project', err);
        }
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}
