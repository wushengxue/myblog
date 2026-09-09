package space.yejian.blog.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import space.yejian.blog.entity.ReadingHistoryEntity;

import java.util.List;
import java.util.Optional;

public interface ReadingHistoryRepository extends JpaRepository<ReadingHistoryEntity, String> {
    List<ReadingHistoryEntity> findByUserIdOrderByViewedAtDesc(String userId);
    Optional<ReadingHistoryEntity> findByUserIdAndContentId(String userId, String contentId);
}
