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
}
