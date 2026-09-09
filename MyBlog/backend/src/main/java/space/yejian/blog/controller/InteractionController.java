package space.yejian.blog.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import space.yejian.blog.dto.CommonDtos;
import space.yejian.blog.service.AuthService;
import space.yejian.blog.service.InteractionService;

import java.util.List;

@RestController
@RequestMapping("/api")
public class InteractionController {
    private final InteractionService interactionService;
    private final AuthService authService;

    public InteractionController(InteractionService interactionService, AuthService authService) {
        this.interactionService = interactionService;
        this.authService = authService;
    }

    @GetMapping("/comments/{contentId}")
    public List<CommonDtos.CommentView> comments(@PathVariable String contentId) {
        return interactionService.comments(contentId);
    }

    @PostMapping("/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommonDtos.CommentView comment(@Valid @RequestBody CommonDtos.CommentRequest request,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return interactionService.addComment(request, requireUser(userId));
    }

    @GetMapping("/subscriptions")
    public List<CommonDtos.SubscriptionView> subscriptions(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam(required = false) String authorId) {
        return interactionService.subscriptions(requireUser(userId), authorId);
    }

    @PostMapping("/subscriptions/{authorId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CommonDtos.SubscriptionView subscribe(@PathVariable String authorId,
                                                 @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return interactionService.subscribe(authorId, requireUser(userId));
    }

    @DeleteMapping("/subscriptions/{authorId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@PathVariable String authorId,
                            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        interactionService.unsubscribe(authorId, requireUser(userId));
    }

    @GetMapping("/history")
    public List<CommonDtos.HistoryView> history(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return interactionService.history(requireUser(userId));
    }

    @PostMapping("/history")
    @ResponseStatus(HttpStatus.CREATED)
    public CommonDtos.HistoryView history(@Valid @RequestBody CommonDtos.HistoryRequest request,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return interactionService.addHistory(request, requireUser(userId));
    }

    private String requireUser(String userId) {
        return authService.requireUser(userId).getId();
    }
}
