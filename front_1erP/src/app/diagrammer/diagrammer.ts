import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, ChangeDetectionStrategy, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as joint from 'jointjs';

@Component({
  selector: 'app-diagrammer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diagrammer.html',
  styleUrl: './diagrammer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiagrammerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('paperContainer') paperContainer!: ElementRef;

  private graph!: joint.dia.Graph;
  private paper!: joint.dia.Paper;
  private swimlanes: joint.shapes.standard.Rectangle[] = [];
  
  // Usando Signals para cumplimiento de estándares
  public selectedCell = signal<joint.dia.Cell | null>(null);
  
  private zone = inject(NgZone);

  constructor() {}

  ngAfterViewInit(): void {
    // Ejecutar JointJS fuera de la zona de Angular para optimizar rendimiento
    this.zone.runOutsideAngular(() => {
      this.initializeDiagram();
    });
  }

  ngOnDestroy(): void {
    if (this.paper) {
      this.paper.remove();
    }
  }

  private initializeDiagram(): void {
    this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });

    this.paper = new joint.dia.Paper({
      el: this.paperContainer.nativeElement,
      model: this.graph,
      width: '100%',
      height: 800,
      gridSize: 10,
      drawGrid: { name: 'dot', color: '#cbd5e1' },
      background: { color: '#ffffff' },
      interactive: true,
      cellViewNamespace: joint.shapes,
      linkPinning: false,
      snapLinks: { radius: 20 },
      defaultLink: () => new joint.shapes.standard.Link({
        attrs: {
          line: {
            stroke: '#64748b',
            strokeWidth: 2,
            targetMarker: {
              'type': 'path',
              'd': 'M 10 -5 0 0 10 5 Z'
            }
          }
        }
      })
    });

    // Eventos de selección
    this.paper.on('cell:pointerdown', (cellView) => {
      // Usamos zone.run para actualizar el Signal y disparar detección de cambios
      this.zone.run(() => {
        this.selectedCell.set(cellView.model);
      });
    });

    this.paper.on('blank:pointerdown', () => {
      this.zone.run(() => {
        this.selectedCell.set(null);
      });
    });

    // Lógica de movimiento y embedding (Mejorada para evitar bloqueos)
    this.graph.on('change:position', (cell: joint.dia.Element) => {
      // 1. Ignorar si el elemento que se mueve es una calle
      if (this.isSwimlane(cell)) return;

      // 2. IMPORTANTE: Ignorar si el elemento tiene un padre que NO es una calle
      // Esto evita bucles infinitos en elementos compuestos como el Nodo Final
      const parent = cell.getParentCell();
      if (parent && !this.isSwimlane(parent)) return;

      const area = cell.getBBox();
      const lane = this.swimlanes.find(l => l.getBBox().containsRect(area));

      if (lane) {
        if (cell.getParentCell() !== lane) {
          lane.embed(cell);
        }
      } else {
        // Si estaba en una calle y ahora no, desembeber solo si el padre era la calle
        if (parent && this.isSwimlane(parent)) {
          parent.unembed(cell);
        }
      }
    });

    // Ajustar scroll al mover elementos cerca del borde
    this.graph.on('change:position', (cell: joint.dia.Element, post) => {
        // Opcional: Implementar auto-expand del lienzo
    });
  }

  addSwimlane(): void {
    const lane = new joint.shapes.standard.Rectangle();
    lane.position(50, 50 + (this.swimlanes.length * 200));
    lane.resize(800, 200);
    lane.attr({
      body: {
        fill: '#f8fafc',
        stroke: '#cbd5e1',
        strokeWidth: 2,
        strokeDasharray: '5,5'
      },
      label: {
        text: `Carril ${this.swimlanes.length + 1}`,
        fill: '#64748b',
        fontSize: 14,
        fontWeight: 'bold',
        refY: 10,
        refY2: 0,
        textVerticalAnchor: 'top'
      }
    });
    
    lane.set('isSwimlane', true);
    lane.set('z', -1); // Las calles siempre al fondo
    this.swimlanes.push(lane);
    this.graph.addCell(lane);
  }

  addActivity(): void {
    const rect = new joint.shapes.standard.Rectangle();
    rect.position(100, 100);
    rect.resize(150, 60);
    rect.attr({
      body: {
        fill: '#ffffff',
        stroke: '#3b82f6',
        strokeWidth: 2,
        rx: 10,
        ry: 10
      },
      label: {
        text: 'Nueva Actividad',
        fill: '#1e293b'
      }
    });
    rect.addTo(this.graph);
  }

  addDecision(): void {
    const diamond = new joint.shapes.standard.Polygon();
    diamond.position(300, 100);
    diamond.resize(60, 60);
    diamond.attr({
      body: {
        refPoints: '0,10 10,0 20,10 10,20',
        fill: '#ffffff',
        stroke: '#f59e0b',
        strokeWidth: 2
      },
      label: {
        text: '¿?',
        fill: '#1e293b'
      }
    });
    diamond.addTo(this.graph);
  }

  addInitialNode(): void {
    const node = new joint.shapes.standard.Circle();
    node.position(500, 100);
    node.resize(30, 30);
    node.attr({
      body: {
        fill: '#1e293b',
        stroke: 'none'
      }
    });
    node.addTo(this.graph);
  }

  addFinalNode(): void {
    const node = new joint.shapes.standard.Circle();
    node.position(600, 100);
    node.resize(30, 30);
    node.attr({
      body: {
        fill: '#ffffff',
        stroke: '#1e293b',
        strokeWidth: 2
      }
    });
    
    const inner = new joint.shapes.standard.Circle();
    inner.resize(20, 20);
    inner.attr({
      body: { fill: '#1e293b', stroke: 'none' }
    });
    
    // El posicionamiento de inner debe ser coordinado
    node.addTo(this.graph);
    inner.addTo(this.graph);
    
    node.embed(inner);
    inner.position(node.position().x + 5, node.position().y + 5);
  }

  updateLabel(newText: string): void {
    const cell = this.selectedCell();
    if (cell) {
      cell.attr('label/text', newText);
    }
  }

  private isSwimlane(cell: joint.dia.Cell): boolean {
    return cell.get('isSwimlane') === true;
  }
}
