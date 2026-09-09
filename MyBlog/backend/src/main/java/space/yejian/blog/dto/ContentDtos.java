package space.yejian.blog.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.List;

public final class ContentDtos {
    private ContentDtos() {}

    public record ContentRequest(
            @NotBlank(message = "内容类型不能为空") String type,
            @NotBlank(message = "标题不能为空") String title,
            String summary,
            String image,
            String content,
            String description,
            String code,
            String language,
            List<String> tagIds,
            String visibility,
            String status,
            Instant scheduledAt
    ) {}

    public record AuthorView(String id, String name, String bio) {}

    public record ContentView(
            String id,
            String type,
            String title,
            String summary,
            String image,
            String content,
            String description,
            String code,
            String language,
            AuthorView author,
            List<String> tagIds,
            String visibility,
            String status,
            Instant scheduledAt,
            Instant publishedAt,
            Instant updatedAt,
            int views
    ) {}
}
