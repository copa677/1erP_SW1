import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../services/project.service';
import { Project } from '../interfaces/project.interface';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  public projectService = inject(ProjectService);
  public authService = inject(AuthService);
  private router = inject(Router);

  showCreateModal = signal<boolean>(false);
  newProjectName = '';
  newProjectDescription = '';

  ngOnInit() {
    this.projectService.loadProjects().subscribe({
      error: (err) => console.error('Error loading projects', err)
    });
  }

  createNewProject() {
    if (this.newProjectName.trim()) {
      this.projectService.createProject(this.newProjectName, this.newProjectDescription).subscribe({
        next: (project) => {
          this.router.navigate(['/editor', project.id]);
        },
        error: (err) => console.error('Error creating project', err)
      });
    }
  }

  deleteProject(event: Event, id: string | undefined) {
    event.stopPropagation();
    if (id && confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      this.projectService.deleteProject(id).subscribe({
        error: (err) => console.error('Error deleting project', err)
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}
