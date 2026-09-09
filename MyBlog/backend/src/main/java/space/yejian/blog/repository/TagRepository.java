package space.yejian.blog.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import space.yejian.blog.entity.TagEntity;

import java.util.Optional;

public interface TagRepository extends JpaRepository<TagEntity, String> {
    Optional<TagEntity> findByNameIgnoreCase(String name);
}
