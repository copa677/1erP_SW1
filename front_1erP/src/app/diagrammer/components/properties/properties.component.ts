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

  onLabelChange(newLabel: string) {
    const cell = this.diagramService.selectedCell();
    if (cell) {
      cell.attr('label/text', newLabel);
    }
  }

  onColorChange(newColor: string) {
    const cell = this.diagramService.selectedCell();
    if (cell) {
      cell.attr('body/fill', newColor);
    }
  }

  deleteElement() {
    const cell = this.diagramService.selectedCell();
    if (cell) {
      cell.remove();
      this.diagramService.closeProperties();
    }
  }
}
