package space.yejian.blog.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "contents")
public class ContentEntity {
    @Id
    private String id;
    private String type;
    private String authorId;
    private String title;
    @Column(length = 2000)
    private String summary;
    @Column(length = 2000)
    private String image;
    @Column(length = 100000)
    private String content;
    @Column(length = 2000)
    private String description;
    @Column(length = 100000)
    private String code;
    private String language;
    private String visibility;
    private String status;
    private Instant scheduledAt;
    private Instant publishedAt;
    private Instant updatedAt;
    private int views;

    @ElementCollection
    @CollectionTable(name = "content_tags", joinColumns = @JoinColumn(name = "content_id"))
    @Column(name = "tag_id")
    private Set<String> tagIds = new LinkedHashSet<>();

    protected ContentEntity() {}

    public ContentEntity(String id, String type, String authorId, String title, String summary, String image, String content,
                         String description, String code, String language, String visibility, String status,
                         Instant scheduledAt, Instant publishedAt, Instant updatedAt, int views, Set<String> tagIds) {
        this.id = id;
        this.type = type;
        this.authorId = authorId;
        this.title = title;
        this.summary = summary;
        this.image = image;
        this.content = content;
        this.description = description;
        this.code = code;
        this.language = language;
        this.visibility = visibility;
        this.status = status;
        this.scheduledAt = scheduledAt;
        this.publishedAt = publishedAt;
        this.updatedAt = updatedAt;
        this.views = views;
        this.tagIds = tagIds == null ? new LinkedHashSet<>() : new LinkedHashSet<>(tagIds);
    }

    public String getId() { return id; }
    public String getType() { return type; }
    public String getAuthorId() { return authorId; }
    public String getTitle() { return title; }
    public String getSummary() { return summary; }
    public String getImage() { return image; }
    public String getContent() { return content; }
    public String getDescription() { return description; }
    public String getCode() { return code; }
    public String getLanguage() { return language; }
    public String getVisibility() { return visibility; }
    public String getStatus() { return status; }
    public Instant getScheduledAt() { return scheduledAt; }
    public Instant getPublishedAt() { return publishedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public int getViews() { return views; }
    public Set<String> getTagIds() { return tagIds; }

    public void setTitle(String title) { this.title = title; }
    public void setSummary(String summary) { this.summary = summary; }
    public void setImage(String image) { this.image = image; }
    public void setContent(String content) { this.content = content; }
    public void setDescription(String description) { this.description = description; }
    public void setCode(String code) { this.code = code; }
    public void setLanguage(String language) { this.language = language; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public void setStatus(String status) { this.status = status; }
    public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public void setTagIds(Set<String> tagIds) { this.tagIds = tagIds == null ? new LinkedHashSet<>() : new LinkedHashSet<>(tagIds); }
    public void incrementViews() { this.views++; }
}
