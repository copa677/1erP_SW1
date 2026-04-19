import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiagramService } from '../../services/diagram.service';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertiesComponent {
  public diagramService = inject(DiagramService);

  public colors = [
    '#ffffff', // Blanco
    '#f8fafc', // Slate 50
    '#fee2e2', // Rojo claro
    '#fef3c7', // Ambar claro
    '#ecfdf5', // Esmeralda claro
    '#eff6ff', // Azul claro
    '#f5f3ff', // Violeta claro
    '#fae8ff', // Fucsia claro
    '#fff1f2', // Rosa claro
    '#e2e8f0'  // Slate 200
  ];

  onLabelChange(newLabel: string) {
    const cell = this.diagramService.selectedCell();
    if (cell) {
      cell.attr('label/text', newLabel);
    }
  }

  onColorChange(newColor: string) {
    const cell = this.diagramService.selectedCell();
    if (cell) {
      if (cell.get('isSwimlane')) {
        cell.attr('body/fill', newColor);
      } else {
        cell.attr('body/fill', newColor);
      }
    }
  }

  deleteElement() {
    const cell = this.diagramService.selectedCell();
    if (cell && confirm('¿Eliminar este elemento?')) {
      cell.remove();
      this.diagramService.closeProperties();
    }
  }
}
