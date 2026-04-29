import { Injectable, inject } from '@angular/core';
import { driver, Driver, Config } from 'driver.js';
import 'driver.js/dist/driver.css';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private driverObj: Driver | null = null;

  constructor() {
    this.initDriver();
  }

  private initDriver() {
    const config: Config = {
      showProgress: true,
      animate: true,
      overlayColor: '#000000bb',
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Atrás',
      doneBtnText: 'Entendido',
      steps: [
        { 
          element: '#dashboard-welcome', 
          popover: { 
            title: '👋 ¡Bienvenido!', 
            description: 'Este es tu nuevo Arquitecto de Flujos Inteligente. Hagamos un tour rápido.',
            side: "bottom", 
            align: 'start' 
          } 
        },
        { 
          element: '#sidebar-nav', 
          popover: { 
            title: '🚀 Navegación Principal', 
            description: 'Aquí puedes cambiar entre tus estadísticas (Dashboard) y tus proyectos de diagramación.',
            side: "right", 
            align: 'start' 
          } 
        },
        { 
          element: '#kpi-grid', 
          popover: { 
            title: '📊 KPIs de Rendimiento', 
            description: 'Visualiza el éxito de tus procesos, ejecuciones totales y detecta cuellos de botella críticos.',
            side: "bottom", 
            align: 'center' 
          } 
        },
        { 
          element: '#health-chart', 
          popover: { 
            title: '📈 Salud del Sistema', 
            description: 'Mira la eficiencia global de tus flujos y la actividad de los últimos 7 días.',
            side: "top", 
            align: 'center' 
          } 
        },
        { 
          element: '#user-profile', 
          popover: { 
            title: '👤 Tu Perfil', 
            description: 'Aquí puedes ver tu rol actual y cerrar sesión cuando termines.',
            side: "top", 
            align: 'start' 
          } 
        }
      ]
    };

    this.driverObj = driver(config);
  }

  startTour(force: boolean = false) {
    const hasSeenTour = localStorage.getItem('has_seen_onboarding');
    
    if (!hasSeenTour || force) {
      setTimeout(() => {
        this.driverObj?.drive();
        localStorage.setItem('has_seen_onboarding', 'true');
      }, 1000);
    }
  }

  startEditorTour(force: boolean = false) {
    const hasSeenEditorTour = localStorage.getItem('has_seen_editor_tour');
    
    if (!hasSeenEditorTour || force) {
      const editorDriver = driver({
        showProgress: true,
        animate: true,
        overlayColor: '#000000cc',
        steps: [
          {
            element: '#editor-toolbar',
            popover: {
              title: '🛠️ Barra de Herramientas',
              description: 'Aquí tienes los elementos básicos: Inicio, Fin, Actividades y Decisiones para dibujar manualmente.',
              side: 'bottom'
            }
          },
          {
            element: '#ai-chat-container',
            popover: {
              title: '🤖 Inteligencia Artificial',
              description: '¡Lo más potente! Escribe o usa tu voz para generar diagramas complejos en segundos.',
              side: 'left'
            }
          },
          {
            element: '#diagram-canvas',
            popover: {
              title: '🎨 El Lienzo',
              description: 'Aquí se visualiza tu flujo. Puedes arrastrar elementos y conectar nodos libremente.',
              side: 'bottom'
            }
          },
          {
            element: '#editor-actions',
            popover: {
              title: '💾 Guardar y Exportar',
              description: 'Cuando termines, guarda tu progreso o descarga el diagrama para compartirlo.',
              side: 'bottom'
            }
          }
        ]
      });

      setTimeout(() => {
        editorDriver.drive();
        localStorage.setItem('has_seen_editor_tour', 'true');
      }, 1500);
    }
  }
}
