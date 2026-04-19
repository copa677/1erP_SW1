package back_1erP.controller;

import back_1erP.model.Project;
import back_1erP.model.User;
import back_1erP.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // Obtener todos los proyectos del usuario autenticado
    @GetMapping
    public ResponseEntity<List<Project>> getMyProjects(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectService.getAllProjectsByOwner(currentUser.getId()));
    }

    // Obtener un proyecto específico
    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(
            @PathVariable String id, 
            @AuthenticationPrincipal User currentUser) {
        return projectService.getProjectById(id)
                .filter(p -> p.getOwnerId().equals(currentUser.getId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(403).build());
    }

    // Crear un nuevo proyecto
    @PostMapping
    public ResponseEntity<Project> createProject(
            @RequestBody Project request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectService.createProject(
                request.getName(), 
                request.getDescription(), 
                currentUser.getId()
        ));
    }

    // Actualizar un proyecto
    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(
             @PathVariable String id,
             @RequestBody Project updatedData,
             @AuthenticationPrincipal User currentUser) {
        try {
            Project project = projectService.updateProject(id, updatedData, currentUser.getId());
            return ResponseEntity.ok(project);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }

    // Eliminar un proyecto
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser) {
        try {
            projectService.deleteProject(id, currentUser.getId());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).build();
        }
    }
}
