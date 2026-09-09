package space.yejian.blog.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "comments")
public class CommentEntity {
    @Id
    private String id;
    private String contentId;
    private String userId;
    private String content;
    private Instant createdAt;

    protected CommentEntity() {}

    public CommentEntity(String id, String contentId, String userId, String content, Instant createdAt) {
        this.id = id;
        this.contentId = contentId;
        this.userId = userId;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public String getContentId() { return contentId; }
    public String getUserId() { return userId; }
    public String getContent() { return content; }
    public Instant getCreatedAt() { return createdAt; }
}
