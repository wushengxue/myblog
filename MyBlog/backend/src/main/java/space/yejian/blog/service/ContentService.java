package space.yejian.blog.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import space.yejian.blog.dto.ContentDtos;
import space.yejian.blog.entity.ContentEntity;
import space.yejian.blog.entity.UserEntity;
import space.yejian.blog.exception.ApiException;
import space.yejian.blog.repository.ContentRepository;
import space.yejian.blog.repository.SubscriptionRepository;
import space.yejian.blog.repository.UserRepository;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class ContentService {
    private final ContentRepository contents;
    private final UserRepository users;
    private final SubscriptionRepository subscriptions;

    public ContentService(ContentRepository contents, UserRepository users, SubscriptionRepository subscriptions) {
        this.contents = contents;
        this.users = users;
        this.subscriptions = subscriptions;
    }

    @Transactional(readOnly = true)
    public List<ContentDtos.ContentView> list(String userId, String type, String query, String tagId) {
        return contents.findAllByOrderByPublishedAtDesc().stream()
                .map(this::promoteIfDue)
                .filter(item -> type == null || type.isBlank() || type.equals(item.getType()))
                .filter(item -> tagId == null || tagId.isBlank() || item.getTagIds().contains(tagId))
                .filter(item -> matches(item, query))
                .filter(item -> canView(item, userId))
                .map(this::toView)
                .toList();
    }

    @Transactional
    public ContentDtos.ContentView find(String type, String id, String userId) {
        ContentEntity item = contents.findById(id)
                .filter(value -> value.getType().equals(type))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "内容不存在"));
        promoteIfDue(item);
        if (!canView(item, userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "此内容暂不可访问");
        }
        item.incrementViews();
        contents.save(item);
        return toView(item);
    }

    @Transactional
    public ContentDtos.ContentView save(ContentDtos.ContentRequest request, String userId, String id) {
        UserEntity author = users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "请先登录"));
        validate(request);
        ContentEntity item = id == null || id.isBlank()
                ? new ContentEntity("content-" + UUID.randomUUID(), request.type(), author.getId(), request.title().trim(),
                null, request.image(), null, null, null, null, "public", "draft", null, null, Instant.now(), 0, Set.of())
                : contents.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "内容不存在"));
        if (!item.getAuthorId().equals(author.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "只能编辑自己的内容");
        }
        Instant now = Instant.now();
        String status = request.status() == null || request.status().isBlank() ? "published" : request.status();
        if ("scheduled".equals(status) && (request.scheduledAt() == null || !request.scheduledAt().isAfter(now))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "发布时间必须晚于当前时间");
        }
        item.setTitle(request.title().trim());
        item.setSummary(request.summary());
        item.setImage(request.image());
        item.setContent(request.content());
        item.setDescription(request.description());
        item.setCode(request.code());
        item.setLanguage(request.language());
        item.setVisibility(normalizeVisibility(request.visibility()));
        item.setStatus(status);
        item.setScheduledAt(request.scheduledAt());
        item.setPublishedAt("published".equals(status) ? (item.getPublishedAt() == null ? now : item.getPublishedAt()) : null);
        item.setUpdatedAt(now);
        item.setTagIds(new LinkedHashSet<>(request.tagIds() == null ? List.of() : request.tagIds()));
        return toView(contents.save(item));
    }

    @Transactional
    public void delete(String type, String id, String userId) {
        ContentEntity item = contents.findById(id)
                .filter(value -> value.getType().equals(type))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "内容不存在"));
        if (!item.getAuthorId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "只能删除自己的内容");
        }
        contents.delete(item);
    }

    @Transactional
    public void addView(String type, String id) {
        contents.findById(id).filter(item -> item.getType().equals(type)).ifPresent(item -> {
            item.incrementViews();
            contents.save(item);
        });
    }

    public boolean canView(ContentEntity item, String userId) {
        promoteIfDue(item);
        if ("draft".equals(item.getStatus()) || "scheduled".equals(item.getStatus())) {
            return item.getAuthorId().equals(userId);
        }
        if ("private".equals(item.getVisibility())) return item.getAuthorId().equals(userId);
        if ("subscribers".equals(item.getVisibility())) {
            return item.getAuthorId().equals(userId)
                    || (userId != null && subscriptions.findBySubscriberIdAndAuthorId(userId, item.getAuthorId()).isPresent());
        }
        return true;
    }

    private ContentEntity promoteIfDue(ContentEntity item) {
        if ("scheduled".equals(item.getStatus()) && item.getScheduledAt() != null && !item.getScheduledAt().isAfter(Instant.now())) {
            item.setStatus("published");
            item.setPublishedAt(item.getScheduledAt());
            contents.save(item);
        }
        return item;
    }

    private boolean matches(ContentEntity item, String query) {
        if (query == null || query.isBlank()) return true;
        String q = query.toLowerCase(Locale.ROOT);
        return Stream.of(item.getTitle(), item.getSummary(), item.getContent(), item.getDescription(), item.getCode(), item.getLanguage())
                .filter(value -> value != null)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .anyMatch(value -> value.contains(q));
    }

    private void validate(ContentDtos.ContentRequest request) {
        if (!List.of("article", "code", "question").contains(request.type())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "不支持的内容类型");
        }
        String body = "code".equals(request.type()) ? request.code() : request.content();
        if (body == null || body.trim().length() < ("code".equals(request.type()) ? 8 : "question".equals(request.type()) ? 12 : 20)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "正文内容过短");
        }
        if ("code".equals(request.type()) && (request.language() == null || request.language().isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "编程语言不能为空");
        }
        if (request.tagIds() == null || request.tagIds().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "至少选择一个标签");
        }
    }

    private String normalizeVisibility(String value) {
        return List.of("public", "private", "subscribers").contains(value) ? value : "public";
    }

    public ContentDtos.ContentView toView(ContentEntity item) {
        UserEntity author = users.findById(item.getAuthorId()).orElse(null);
        ContentDtos.AuthorView authorView = author == null ? new ContentDtos.AuthorView(item.getAuthorId(), "未知作者", "") :
                new ContentDtos.AuthorView(author.getId(), author.getName(), author.getBio());
        return new ContentDtos.ContentView(item.getId(), item.getType(), item.getTitle(), item.getSummary(),
                item.getImage(), item.getContent(), item.getDescription(), item.getCode(), item.getLanguage(), authorView,
                item.getTagIds().stream().sorted().toList(), item.getVisibility(), item.getStatus(),
                item.getScheduledAt(), item.getPublishedAt(), item.getUpdatedAt(), item.getViews());
    }
}
