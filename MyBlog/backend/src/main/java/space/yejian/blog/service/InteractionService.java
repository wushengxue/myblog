package space.yejian.blog.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import space.yejian.blog.dto.CommonDtos;
import space.yejian.blog.entity.CommentEntity;
import space.yejian.blog.entity.ReadingHistoryEntity;
import space.yejian.blog.entity.SubscriptionEntity;
import space.yejian.blog.entity.UserEntity;
import space.yejian.blog.exception.ApiException;
import space.yejian.blog.repository.CommentRepository;
import space.yejian.blog.repository.ContentRepository;
import space.yejian.blog.repository.ReadingHistoryRepository;
import space.yejian.blog.repository.SubscriptionRepository;
import space.yejian.blog.repository.UserRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class InteractionService {
    private final CommentRepository comments;
    private final ContentRepository contents;
    private final SubscriptionRepository subscriptions;
    private final ReadingHistoryRepository history;
    private final UserRepository users;
    private final ContentService contentService;

    public InteractionService(CommentRepository comments, ContentRepository contents, SubscriptionRepository subscriptions,
                              ReadingHistoryRepository history, UserRepository users, ContentService contentService) {
        this.comments = comments;
        this.contents = contents;
        this.subscriptions = subscriptions;
        this.history = history;
        this.users = users;
        this.contentService = contentService;
    }

    @Transactional(readOnly = true)
    public List<CommonDtos.CommentView> comments(String contentId) {
        return comments.findByContentIdOrderByCreatedAtDesc(contentId).stream().map(comment -> {
            UserEntity user = users.findById(comment.getUserId()).orElse(null);
            return new CommonDtos.CommentView(comment.getId(), comment.getContentId(), comment.getUserId(),
                    user == null ? "匿名用户" : user.getName(), comment.getContent(), comment.getCreatedAt());
        }).toList();
    }

    @Transactional
    public CommonDtos.CommentView addComment(CommonDtos.CommentRequest request, String userId) {
        if (request.content().trim().length() < 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "评论至少需要 5 个有效字符");
        }
        if (contents.findById(request.contentId()).isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "内容不存在");
        }
        UserEntity user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "请先登录"));
        CommentEntity comment = comments.save(new CommentEntity("comment-" + UUID.randomUUID(), request.contentId(), userId,
                request.content().trim(), Instant.now()));
        return new CommonDtos.CommentView(comment.getId(), comment.getContentId(), userId, user.getName(),
                comment.getContent(), comment.getCreatedAt());
    }

    @Transactional
    public CommonDtos.SubscriptionView subscribe(String authorId, String userId) {
        if (userId.equals(authorId)) throw new ApiException(HttpStatus.BAD_REQUEST, "不能订阅自己");
        if (users.findById(authorId).isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "作者不存在");
        SubscriptionEntity existing = subscriptions.findBySubscriberIdAndAuthorId(userId, authorId).orElse(null);
        if (existing != null) {
            throw new ApiException(HttpStatus.CONFLICT, "已订阅该作者");
        }
        SubscriptionEntity saved = subscriptions.save(new SubscriptionEntity("sub-" + UUID.randomUUID(), userId, authorId, Instant.now()));
        return new CommonDtos.SubscriptionView(saved.getId(), saved.getSubscriberId(), saved.getAuthorId(), saved.getCreatedAt());
    }

    @Transactional
    public void unsubscribe(String authorId, String userId) {
        subscriptions.findBySubscriberIdAndAuthorId(userId, authorId).ifPresent(subscriptions::delete);
    }

    @Transactional(readOnly = true)
    public List<CommonDtos.SubscriptionView> subscriptions(String userId, String authorId) {
        var result = authorId == null || authorId.isBlank()
                ? subscriptions.findBySubscriberId(userId)
                : subscriptions.findByAuthorId(authorId);
        return result.stream().map(item -> new CommonDtos.SubscriptionView(item.getId(), item.getSubscriberId(), item.getAuthorId(), item.getCreatedAt())).toList();
    }

    @Transactional(readOnly = true)
    public List<CommonDtos.HistoryView> history(String userId) {
        return history.findByUserIdOrderByViewedAtDesc(userId).stream()
                .map(item -> new CommonDtos.HistoryView(item.getId(), item.getUserId(), item.getContentType(), item.getContentId(), item.getViewedAt()))
                .toList();
    }

    @Transactional
    public CommonDtos.HistoryView addHistory(CommonDtos.HistoryRequest request, String userId) {
        ReadingHistoryEntity item = history.findByUserIdAndContentId(userId, request.contentId()).orElse(null);
        if (item != null) {
            history.delete(item);
        }
        ReadingHistoryEntity saved = history.save(new ReadingHistoryEntity(
                userId + "-" + request.contentType() + "-" + request.contentId(),
                userId, request.contentType(), request.contentId(), Instant.now()
        ));
        return new CommonDtos.HistoryView(saved.getId(), saved.getUserId(), saved.getContentType(), saved.getContentId(), saved.getViewedAt());
    }
}
