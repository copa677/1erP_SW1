import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DiagramService } from './diagram.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private http = inject(HttpClient);
  private diagramService = inject(DiagramService);
  private apiUrl = 'http://localhost:8000';

  async sendPrompt(prompt: string) {
    const state = {
      cells: this.diagramService.graph.getCells().map(c => c.toJSON())
    };

    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/generate`, { prompt, state })
      );

      // Los comandos vienen como string JSON dentro de response.commands
      let commands = [];
      try {
        // Limpiamos posibles backticks del LLM (Markdown)
        const cleanJson = response.commands.replace(/```json|```/g, '').trim();
        commands = JSON.parse(cleanJson);
      } catch (e) {
        console.error('Error parseando comandos de IA:', e);
        return { error: 'La IA devolvió un formato inválido' };
      }

      await this.executeCommands(commands);
      return { success: true, count: commands.length };
    } catch (error) {
      console.error('Error llamando a la IA:', error);
      throw error;
    }
  }

  private async executeCommands(commands: any[]) {
    for (const cmd of commands) {
      switch (cmd.action) {
        case 'CREATE_LANE':
          // Lógica para crear carril (necesitaríamos agregar este método a DiagramService)
          this.diagramService.addElement('activity', cmd.x || 100, cmd.y || 100); 
          // Nota: Por ahora usamos addElement genérico, luego refinaremos DiagramService
          break;
        case 'CREATE_NODE':
          this.diagramService.addElement(cmd.type, cmd.x, cmd.y);
          break;
        case 'MOVE':
          const cell = this.diagramService.graph.getCell(cmd.id) as any;
          if (cell && cell.position) cell.position(cmd.x, cmd.y);
          break;
        case 'DELETE':
          const toDelete = this.diagramService.graph.getCell(cmd.id);
          if (toDelete) toDelete.remove();
          break;
      }
      // Pequeño delay para ver la magia ocurrir secuencialmente
      await new Promise(r => setTimeout(r, 200));
    }
  }
}
