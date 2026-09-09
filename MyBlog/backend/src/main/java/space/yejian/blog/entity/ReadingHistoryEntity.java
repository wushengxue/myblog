package space.yejian.blog.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "reading_history")
public class ReadingHistoryEntity {
    @Id
    private String id;
    private String userId;
    private String contentType;
    private String contentId;
    private Instant viewedAt;

    protected ReadingHistoryEntity() {}

    public ReadingHistoryEntity(String id, String userId, String contentType, String contentId, Instant viewedAt) {
        this.id = id;
        this.userId = userId;
        this.contentType = contentType;
        this.contentId = contentId;
        this.viewedAt = viewedAt;
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getContentType() { return contentType; }
    public String getContentId() { return contentId; }
    public Instant getViewedAt() { return viewedAt; }
}
