package space.yejian.blog.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;
import space.yejian.blog.dto.CommonDtos;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    @PostMapping("/answer")
    public CommonDtos.AiResponse answer(@Valid @RequestBody CommonDtos.AiRequest request) {
        String selected = request.selectedText() == null || request.selectedText().isBlank()
                ? "当前文章上下文" : "你选中的内容";
        String title = request.article() == null ? "这篇内容" : "《" + request.article().title() + "》";
        String answer = selected + "可以放回 " + title + " 的整体语境中理解。针对“"
                + request.question().trim() + "”，建议先确认它解决的具体问题，再结合上下文提炼一个可以马上验证的小行动。这是后端本地模拟回答。";
        return new CommonDtos.AiResponse(answer);
    }
}
