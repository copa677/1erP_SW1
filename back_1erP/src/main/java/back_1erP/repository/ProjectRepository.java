package back_1erP.repository;

import back_1erP.model.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {
    
    // Buscar todos los proyectos capitaneados por un usuario específico
    List<Project> findByOwnerId(String ownerId);
}
