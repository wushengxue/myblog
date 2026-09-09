package space.yejian.blog.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import space.yejian.blog.entity.ContentEntity;

import java.util.List;

public interface ContentRepository extends JpaRepository<ContentEntity, String> {
    List<ContentEntity> findAllByOrderByPublishedAtDesc();
}
