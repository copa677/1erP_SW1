package back_1erP.service;

import back_1erP.model.Project;
import back_1erP.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    public List<Project> getAllProjectsByOwner(String ownerId) {
        return projectRepository.findByOwnerId(ownerId);
    }

    public Optional<Project> getProjectById(String id) {
        return projectRepository.findById(id);
    }

    public Project createProject(String name, String description, String ownerId) {
        Project project = Project.builder()
                .name(name)
                .description(description)
                .ownerId(ownerId)
                .elementCount(0)
                .build();
        return projectRepository.save(project);
    }

    public Project updateProject(String id, Project updatedData, String ownerId) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proyecto no encontrado"));

        // Verificación de seguridad básica: solo el dueño puede actualizar
        if (!existingProject.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("No tienes permisos para editar este proyecto");
        }

        existingProject.setName(updatedData.getName());
        existingProject.setDescription(updatedData.getDescription());
        existingProject.setData(updatedData.getData());
        existingProject.setElementCount(updatedData.getElementCount());

        return projectRepository.save(existingProject);
    }

    public void deleteProject(String id, String ownerId) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proyecto no encontrado"));

        if (!existingProject.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("No tienes permisos para eliminar este proyecto");
        }

        projectRepository.delete(existingProject);
    }
}
