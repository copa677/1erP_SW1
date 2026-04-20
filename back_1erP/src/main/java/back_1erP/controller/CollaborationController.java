package back_1erP.controller;

import back_1erP.dto.CollaborationMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class CollaborationController {

    /**
     * Recibe actualizaciones del diagrama de un cliente y las retransmite a todos
     * los colaboradores suscritos al proyecto específico.
     */
    @MessageMapping("/project/{projectId}/update")
    @SendTo("/topic/project/{projectId}")
    public CollaborationMessage broadcastUpdate(
            @DestinationVariable String projectId,
            @Payload CollaborationMessage message,
            SimpMessageHeaderAccessor headerAccessor) {
        
        // Aquí podríamos validar persistencia en base de datos si fuera necesario,
        // pero para tiempo real fluido, la retransmisión directa es clave.
        return message; 
    }

    /**
     * Notifica el estado de presencia (unirse/salir)
     */
    @MessageMapping("/project/{projectId}/presence")
    @SendTo("/topic/project/{projectId}/presence")
    public CollaborationMessage handlePresence(
            @DestinationVariable String projectId,
            @Payload CollaborationMessage message) {
        return message;
    }
}
