package space.yejian.blog.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import space.yejian.blog.dto.ContentDtos;
import space.yejian.blog.exception.ApiException;
import space.yejian.blog.service.AuthService;
import space.yejian.blog.service.ContentService;

import java.util.List;

@RestController
@RequestMapping("/api/content")
public class ContentController {
    private final ContentService contentService;
    private final AuthService authService;

    public ContentController(ContentService contentService, AuthService authService) {
        this.contentService = contentService;
        this.authService = authService;
    }

    @GetMapping
    public List<ContentDtos.ContentView> list(@RequestHeader(value = "X-User-Id", required = false) String userId,
                                              @RequestParam(required = false) String type,
                                              @RequestParam(required = false) String q,
                                              @RequestParam(required = false) String tag) {
        return contentService.list(userId, type, q, tag);
    }

    @GetMapping("/{type}/{id}")
    public ContentDtos.ContentView detail(@PathVariable String type, @PathVariable String id,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return contentService.find(type, id, userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContentDtos.ContentView create(@Valid @RequestBody ContentDtos.ContentRequest request,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return contentService.save(request, requireUser(userId), null);
    }

    @PutMapping("/{type}/{id}")
    public ContentDtos.ContentView update(@PathVariable String type, @PathVariable String id,
                                          @Valid @RequestBody ContentDtos.ContentRequest request,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!type.equals(request.type())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "内容类型不一致");
        }
        return contentService.save(request, requireUser(userId), id);
    }

    @DeleteMapping("/{type}/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String type, @PathVariable String id,
                       @RequestHeader(value = "X-User-Id", required = false) String userId) {
        contentService.delete(type, id, requireUser(userId));
    }

    @PostMapping("/{type}/{id}/view")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addView(@PathVariable String type, @PathVariable String id) {
        contentService.addView(type, id);
    }

    private String requireUser(String userId) {
        return authService.requireUser(userId).getId();
    }
}
