package space.yejian.blog.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public final class CommonDtos {
    private CommonDtos() {}

    public record UserView(String id, String name, String phone, String email, String bio) {}
    public record AuthResponse(UserView user, String token) {}
    public record TagView(String id, String name, long count) {}
    public record TagRequest(@NotBlank(message = "标签不能为空") String name) {}
    public record CommentRequest(@NotBlank(message = "内容 ID 不能为空") String contentId,
                                 @NotBlank(message = "评论不能为空") String content) {}
    public record CommentView(String id, String contentId, String userId, String userName, String content, Instant createdAt) {}
    public record SubscriptionView(String id, String subscriberId, String authorId, Instant createdAt) {}
    public record HistoryRequest(@NotBlank(message = "内容类型不能为空") String contentType,
                                 @NotBlank(message = "内容 ID 不能为空") String contentId) {}
    public record HistoryView(String id, String userId, String contentType, String contentId, Instant viewedAt) {}
    public record AiRequest(String question, String selectedText, String context, ContentRef article) {}
    public record ContentRef(String id, String title, String type) {}
    public record AiResponse(String answer) {}
}
