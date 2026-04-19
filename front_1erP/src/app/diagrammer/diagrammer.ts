import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { PropertiesComponent } from './components/properties/properties.component';
import { DiagramService } from './services/diagram.service';
import { ProjectService } from '../services/project.service';
import { Project } from '../interfaces/project.interface';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-diagrammer',
  standalone: true,
  imports: [CommonModule, ToolbarComponent, CanvasComponent, PropertiesComponent, RouterModule],
  templateUrl: './diagrammer.html',
  styleUrl: './diagrammer.css'
})
export class DiagrammerComponent implements OnInit {
  public diagramService = inject(DiagramService);
  private projectService = inject(ProjectService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentProject?: Project;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.projectService.getProjectById(id).subscribe({
        next: (project) => {
          this.currentProject = project;
          if (project.data) {
            // Pequeño delay para asegurar que el canvas esté inicializado
            setTimeout(() => {
              this.diagramService.importJSON(project.data);
            }, 100);
          }
        },
        error: (err) => {
          console.error('Error loading project', err);
          this.notificationService.error('No se pudo cargar el proyecto');
          this.router.navigate(['/dashboard']);
        }
      });
    });
  }

  get elementCount() {
    return this.diagramService.graph.getCells().length;
  }

  async clearCanvas() {
    const confirmed = await this.notificationService.confirm(
      '¿Estás seguro de que deseas limpiar todo el lienzo? Esta acción eliminará todos los elementos actuales.',
      'Limpiar Lienzo',
      'Limpiar Todo',
      'Mantener diagrama',
      'danger'
    );

    if (confirmed) {
      this.diagramService.graph.clear();
      this.diagramService.closeProperties();
      this.notificationService.info('Lienzo limpiado');
    }
  }

  saveProject() {
    if (this.currentProject && this.currentProject.id) {
      const data = this.diagramService.exportJSON();
      
      const updatedProject: Project = {
        ...this.currentProject,
        data: data,
        elementCount: this.elementCount
      };

      this.projectService.updateProject(this.currentProject.id, updatedProject).subscribe({
        next: (saved) => {
          this.currentProject = saved;
          this.notificationService.success('Proyecto guardado correctamente');
        },
        error: (err) => {
          console.error('Error saving project', err);
          this.notificationService.error('Error al guardar el proyecto');
        }
      });
    }
  }

  downloadJSON() {
    const data = this.diagramService.exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.currentProject?.name || 'diagrama'}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.notificationService.info('Archivo JSON generado');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const json = JSON.parse(e.target.result);
          this.diagramService.importJSON(json);
          this.notificationService.success('Diagrama cargado con éxito');
          event.target.value = '';
        } catch (err) {
          this.notificationService.error('Error: El archivo no es un JSON válido');
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    }
  }
}
