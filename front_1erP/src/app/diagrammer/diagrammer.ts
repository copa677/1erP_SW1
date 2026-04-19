import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { PropertiesComponent } from './components/properties/properties.component';
import { DiagramService } from './services/diagram.service';

@Component({
  selector: 'app-diagrammer',
  standalone: true,
  imports: [CommonModule, ToolbarComponent, CanvasComponent, PropertiesComponent],
  templateUrl: './diagrammer.html',
  styleUrl: './diagrammer.css',
  // Con Signals y Angular moderno, la detección Default es suficiente y más segura
})
export class DiagrammerComponent {
  public diagramService = inject(DiagramService);

  get elementCount() {
    return this.diagramService.graph.getCells().length;
  }

  clearCanvas() {
    if (confirm('¿Estás seguro de que deseas limpiar todo el lienzo?')) {
      this.diagramService.graph.clear();
      this.diagramService.closeProperties();
    }
  }

  saveProject() {
    const data = this.diagramService.exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagrama_${new Date().getTime()}.json`;
    link.click();
    
    window.URL.revokeObjectURL(url);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const json = JSON.parse(e.target.result);
          this.diagramService.importJSON(json);
          // Resetear el input para permitir cargar el mismo archivo de nuevo
          event.target.value = '';
        } catch (err) {
          alert('Error al cargar el archivo. Asegúrate de que es un JSON válido.');
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    }
  }
}
