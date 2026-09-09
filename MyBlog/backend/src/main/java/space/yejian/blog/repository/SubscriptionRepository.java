package space.yejian.blog.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import space.yejian.blog.entity.SubscriptionEntity;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<SubscriptionEntity, String> {
    Optional<SubscriptionEntity> findBySubscriberIdAndAuthorId(String subscriberId, String authorId);
    List<SubscriptionEntity> findBySubscriberId(String subscriberId);
    List<SubscriptionEntity> findByAuthorId(String authorId);
}
