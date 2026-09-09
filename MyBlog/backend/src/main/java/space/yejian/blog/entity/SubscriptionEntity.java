package space.yejian.blog.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "subscriptions")
public class SubscriptionEntity {
    @Id
    private String id;
    private String subscriberId;
    private String authorId;
    private Instant createdAt;

    protected SubscriptionEntity() {}

    public SubscriptionEntity(String id, String subscriberId, String authorId, Instant createdAt) {
        this.id = id;
        this.subscriberId = subscriberId;
        this.authorId = authorId;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public String getSubscriberId() { return subscriberId; }
    public String getAuthorId() { return authorId; }
    public Instant getCreatedAt() { return createdAt; }
}
