package space.yejian.blog.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import space.yejian.blog.dto.CommonDtos;
import space.yejian.blog.entity.TagEntity;
import space.yejian.blog.exception.ApiException;
import space.yejian.blog.repository.ContentRepository;
import space.yejian.blog.repository.TagRepository;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/tags")
public class TagController {
    private final TagRepository tags;
    private final ContentRepository contents;

    public TagController(TagRepository tags, ContentRepository contents) {
        this.tags = tags;
        this.contents = contents;
    }

    @GetMapping
    public List<CommonDtos.TagView> list() {
        return tags.findAll().stream()
                .map(tag -> new CommonDtos.TagView(tag.getId(), tag.getName(),
                        contents.findAll().stream().filter(item -> item.getTagIds().contains(tag.getId())).count()))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommonDtos.TagView create(@Valid @RequestBody CommonDtos.TagRequest request) {
        String name = request.name().trim();
        if (name.length() > 30) throw new ApiException(HttpStatus.BAD_REQUEST, "标签长度不能超过 30 个字符");
        if (!name.matches("[\\p{L}\\p{N}_-]+")) throw new ApiException(HttpStatus.BAD_REQUEST, "标签包含非法字符");
        if (tags.findByNameIgnoreCase(name).isPresent()) throw new ApiException(HttpStatus.CONFLICT, "标签已存在");
        TagEntity tag = tags.save(new TagEntity(name.toLowerCase(Locale.ROOT) + "-" + UUID.randomUUID(), name));
        return new CommonDtos.TagView(tag.getId(), tag.getName(), 0);
    }
}
