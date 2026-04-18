import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as joint from 'jointjs';

@Component({
  selector: 'app-diagrammer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diagrammer.html',
  styleUrl: './diagrammer.css'
})
export class DiagrammerComponent implements OnInit, AfterViewInit {
  @ViewChild('paperContainer') paperContainer!: ElementRef;

  graph!: joint.dia.Graph;
  paper!: joint.dia.Paper;
  selectedCell: joint.dia.Cell | null = null;
  
  private swimlanes: joint.shapes.standard.Rectangle[] = [];
  private laneHeight = 200;
  private laneWidth = 1000;

  constructor() {}

  ngOnInit(): void {
    this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
  }

  ngAfterViewInit(): void {
    this.paper = new joint.dia.Paper({
      el: this.paperContainer.nativeElement,
      model: this.graph,
      width: '100%',
      height: 800,
      gridSize: 10,
      drawGrid: true,
      background: {
        color: '#f8fafc'
      },
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

    // Eventos de interacción
    this.paper.on('cell:pointerdown', (cellView) => {
      this.selectedCell = cellView.model;
    });

    this.paper.on('blank:pointerdown', () => {
      this.selectedCell = null;
    });

    // Lógica de embedding automática
    this.graph.on('change:position', (cell: joint.dia.Element, newPosition) => {
      if (cell.get('type') === 'standard.Rectangle' && this.isSwimlane(cell)) return;

      const area = cell.getBBox();
      const lane = this.swimlanes.find(l => l.getBBox().containsRect(area));

      if (lane) {
        if (cell.getParentCell() !== lane) {
          lane.embed(cell);
        }
      } else {
        const currentParent = cell.getParentCell();
        if (currentParent) {
          currentParent.unembed(cell);
        }
      }
    });

    // Inicializar con dos carriles de ejemplo
    this.addSwimlane('Departamento de Ventas');
    this.addSwimlane('Departamento de Finanzas');
  }

  private isSwimlane(cell: joint.dia.Cell): boolean {
    return cell.get('isSwimlane') === true;
  }

  addSwimlane(name: string = 'Nuevo Departamento'): void {
    const yOffset = this.swimlanes.length * this.laneHeight;
    
    const lane = new joint.shapes.standard.Rectangle();
    lane.position(50, 50 + yOffset);
    lane.resize(this.laneWidth, this.laneHeight);
    lane.attr({
      body: {
        fill: 'rgba(241, 245, 249, 0.3)',
        stroke: '#cbd5e1',
        strokeWidth: 2,
        strokeDasharray: '5,5'
      },
      label: {
        text: name,
        fill: '#64748b',
        fontSize: 14,
        fontWeight: 'bold',
        textVerticalAnchor: 'top',
        textAnchor: 'start',
        refX: 10,
        refY: 10
      }
    });
    lane.set('isSwimlane', true);
    lane.addTo(this.graph);
    this.swimlanes.push(lane);
    
    // Mandar al fondo para que no tape otros elementos
    lane.toBack();
  }

  addInitialNode(): void {
    const node = new joint.shapes.standard.Circle();
    node.position(100, 100);
    node.resize(30, 30);
    node.attr({
      body: { fill: '#1e293b', stroke: 'none' }
    });
    node.addTo(this.graph);
  }

  addActivity(text: string = 'Nueva Actividad'): void {
    const node = new joint.shapes.standard.Rectangle();
    node.position(200, 100);
    node.resize(150, 60);
    node.attr({
      body: {
        fill: '#ffffff',
        stroke: '#3b82f6',
        strokeWidth: 2,
        rx: 10,
        ry: 10
      },
      label: {
        text: text,
        fill: '#1e293b',
        fontSize: 12
      }
    });
    node.addTo(this.graph);
  }

  addDecision(): void {
    const node = new joint.shapes.standard.Polygon();
    node.position(400, 100);
    node.resize(60, 60);
    node.attr({
      body: {
        refPoints: '0,10 10,0 20,10 10,20',
        fill: '#ffffff',
        stroke: '#f59e0b',
        strokeWidth: 2
      },
      label: {
        text: '?',
        fill: '#1e293b',
        fontSize: 14,
        fontWeight: 'bold'
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
    node.embed(inner);
    inner.position(node.position().x + 5, node.position().y + 5);
    
    node.addTo(this.graph);
    inner.addTo(this.graph);
  }

  updateLabel(newText: string): void {
    if (this.selectedCell) {
      this.selectedCell.attr('label/text', newText);
    }
  }
}
