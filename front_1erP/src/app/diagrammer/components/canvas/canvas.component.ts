import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, NgZone, ChangeDetectionStrategy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramService } from '../../services/diagram.service';
import { UMLShapes } from '../../elements/uml-shapes';
import * as joint from 'jointjs';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('paperElement') paperElement!: ElementRef;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  
  private diagramService = inject(DiagramService);
  private zone = inject(NgZone);
  private renderer = inject(Renderer2);
  
  private currentScale = 1;
  private eventListeners: (() => void)[] = [];

  // Paneo
  public isPanning = false;
  private lastX = 0;
  private lastY = 0;

  // Doble Clic
  private lastClickTime = 0;
  private clickThreshold = 400;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.initPaper();
      this.initPanListeners();
      this.initZoomListener();
    });
  }

  ngOnDestroy(): void {
    if (this.diagramService.paper) this.diagramService.paper.remove();
    this.eventListeners.forEach(unlisten => unlisten());
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  private initPanListeners() {
      // 1. INICIO DEL EVENTO (mousedown NATIVO para evitar bloqueos de la librería)
      const unlistenDown = this.renderer.listen(this.canvasContainer.nativeElement, 'mousedown', (evt: MouseEvent) => {
          // CLIC DERECHO (Botón 2 o which 3) -> PANEO UNIVERSAL
          if (evt.button === 2 || evt.which === 3) {
              this.zone.run(() => {
                  this.isPanning = true;
              });
              this.lastX = evt.clientX;
              this.lastY = evt.clientY;
              this.renderer.addClass(this.canvasContainer.nativeElement, 'panning');
              evt.stopPropagation();
              return;
          }

          // SEGUIMIENTO DE DOBLE CLIC (Botón izquierdo)
          if (evt.button === 0) {
              const now = Date.now();
              if (now - this.lastClickTime < this.clickThreshold) {
                  const localPoint = this.diagramService.paper.clientToLocalPoint({ x: evt.clientX, y: evt.clientY });
                  const cell = this.diagramService.graph.findModelsFromPoint(localPoint)[0];
                  if (cell) {
                      this.zone.run(() => {
                          this.diagramService.selectCell(cell);
                      });
                  }
              }
              this.lastClickTime = now;
          }
      });

      // 2. MOVIMIENTO GLOBAL
      const unlistenMove = this.renderer.listen('window', 'mousemove', (evt: MouseEvent) => {
          if (!this.isPanning || !this.diagramService.paper) return;
          
          const dx = evt.clientX - this.lastX;
          const dy = evt.clientY - this.lastY;
          const currentT = this.diagramService.paper.translate();
          this.diagramService.paper.translate(currentT.tx + dx, currentT.ty + dy);
          
          this.lastX = evt.clientX;
          this.lastY = evt.clientY;
      });

      // 3. FINALIZACIÓN GLOBAL
      const unlistenUp = this.renderer.listen('window', 'mouseup', () => {
          if (this.isPanning) {
              this.zone.run(() => {
                  this.isPanning = false;
              });
              this.renderer.removeClass(this.canvasContainer.nativeElement, 'panning');
          }
      });

      this.eventListeners.push(unlistenDown, unlistenMove, unlistenUp);
  }

  private initZoomListener() {
    const unlisten = this.renderer.listen(this.canvasContainer.nativeElement, 'wheel', (event: WheelEvent) => {
        if (event.ctrlKey) {
            event.preventDefault();
            this.zone.run(() => {
                const delta = Math.max(-1, Math.min(1, (event.deltaY || -event.detail)));
                const newScale = this.currentScale - delta * 0.1;
                if (newScale >= 0.2 && newScale <= 3) {
                    this.currentScale = newScale;
                    this.diagramService.paper.scale(newScale, newScale);
                }
            });
        }
    });
    this.eventListeners.push(unlisten);
  }

  private initPaper() {
    this.diagramService.paper = new joint.dia.Paper({
      el: this.paperElement.nativeElement,
      model: this.diagramService.graph,
      width: 5000,
      height: 5000,
      gridSize: 10,
      drawGrid: { name: 'dot', color: '#cbd5e1' },
      background: { color: 'transparent' },
      interactive: true,
      cellViewNamespace: { ...joint.shapes, ...UMLShapes },
      linkPinning: false,
      defaultRouter: { name: 'manhattan', args: { padding: 20 } },
      defaultConnector: { name: 'rounded' },
      validateConnection: (cellViewS, magnetS, cellViewT, magnetT) => {
          return !!magnetT && magnetS !== magnetT;
      },
      snapLinks: { radius: 25 },
      defaultLink: () => new joint.shapes.standard.Link({
        attrs: {
          line: { stroke: '#64748b', strokeWidth: 2, targetMarker: { 'type': 'path', 'd': 'M 10 -5 0 0 10 5 Z' } }
        }
      })
    });

    // Clic izquierdo simple para herramientas rápidas (X y redimensionado)
    this.diagramService.paper.on('cell:pointerdown', (cellView, evt) => {
      if (evt.button === 0) {
        this.zone.run(() => {
          this.diagramService.selectCell(cellView.model);
        });
      }
    });

    this.diagramService.paper.on('blank:pointerdown', (evt) => {
      if (evt.button === 0) {
        this.zone.run(() => {
          this.diagramService.closeProperties();
        });
      }
    });

    this.diagramService.graph.on('change:position', (cell: joint.dia.Element) => {
      if (cell.get('isSwimlane')) return;
      const parent = cell.getParentCell();
      if (parent && !parent.get('isSwimlane')) return;
      const area = cell.getBBox();
      const lanes = this.diagramService.graph.getCells().filter(c => c.get('isSwimlane')) as joint.shapes.standard.Rectangle[];
      const targetLane = lanes.find(l => l.getBBox().containsRect(area));
      if (targetLane) {
        if (cell.getParentCell() !== targetLane) targetLane.embed(cell);
      } else if (parent && parent.get('isSwimlane')) {
        parent.unembed(cell);
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const type = event.dataTransfer?.getData('type');
    if (type) {
      const offset = this.paperElement.nativeElement.getBoundingClientRect();
      const x = (event.clientX - offset.left - this.diagramService.paper.translate().tx) / this.currentScale;
      const y = (event.clientY - offset.top - this.diagramService.paper.translate().ty) / this.currentScale;
      this.zone.run(() => this.diagramService.addElement(type, x, y));
    }
  }
}
