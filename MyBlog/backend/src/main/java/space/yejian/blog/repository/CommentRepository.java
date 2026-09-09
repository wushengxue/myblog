package space.yejian.blog.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import space.yejian.blog.entity.CommentEntity;

import java.util.List;

public interface CommentRepository extends JpaRepository<CommentEntity, String> {
    List<CommentEntity> findByContentIdOrderByCreatedAtDesc(String contentId);
}
