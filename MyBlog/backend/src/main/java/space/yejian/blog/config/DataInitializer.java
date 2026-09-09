package space.yejian.blog.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import space.yejian.blog.entity.ContentEntity;
import space.yejian.blog.entity.TagEntity;
import space.yejian.blog.entity.UserEntity;
import space.yejian.blog.repository.ContentRepository;
import space.yejian.blog.repository.TagRepository;
import space.yejian.blog.repository.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.Set;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner seedData(UserRepository users, ContentRepository contents, TagRepository tags, PasswordEncoder encoder) {
        return args -> {
            UserEntity demo = users.findByEmailIgnoreCase("demo@yejian.space").orElseGet(() -> users.save(new UserEntity(
                    "user-demo", "林默", "13800138000", "110101199001011234",
                    "demo@yejian.space", encoder.encode("Demo123456"), "写字，也观察生活的纹理。", Instant.now()
            )));

            seedTag(tags, "slow-life", "慢生活");
            seedTag(tags, "thinking", "思考");
            seedTag(tags, "design", "设计");
            seedTag(tags, "technology", "技术");
            seedTag(tags, "reading", "阅读");

            if (contents.count() == 0) {
                Instant now = Instant.now();
                contents.save(new ContentEntity(
                        "attention", "article", demo.getId(), "把注意力还给真正重要的事",
                        "我们总在被提醒、被打断、被新的消息带走。也许真正稀缺的不是时间，而是一次完整的注意。",
                        null,
                        "注意力从来不是一个无限供给的资源。每一次切换窗口、查看消息、接受一个新的刺激，都会让我们暂时离开正在做的事。\n\n当生活被很多细小的提醒切成碎片，我们会误以为自己一直很忙，却很少真正抵达一件事的内部。",
                        null, null, null, "public", "published", null, now.minus(5, ChronoUnit.DAYS), now, 1284,
                        new LinkedHashSet<>(Set.of("slow-life", "thinking"))
                ));
                contents.save(new ContentEntity(
                        "ordinary-days", "article", demo.getId(), "在普通日子里，练习发现",
                        "生活并不总是发生大事。我们可以从一杯茶的温度、一段路的光线里，重新认识正在经过的日子。",
                        null,
                        "我们常常把生活的价值寄托在少数高光时刻，却忘记大多数时间都由平常构成。平常不是等待发生什么，而是事情正在以更轻的声音发生。",
                        null, null, null, "public", "published", null, now.minus(7, ChronoUnit.DAYS), now, 896,
                        new LinkedHashSet<>(Set.of("slow-life", "reading"))
                ));
                contents.save(new ContentEntity(
                        "code-reading-room", "code", demo.getId(), "一个轻量的阅读进度记录器",
                        null, null, "用原生 JavaScript 记录阅读进度，适合放进个人工具箱。",
                        null,
                        "const progress = new Map()\n\nexport function markRead(articleId, percent) {\n  progress.set(articleId, Math.min(100, Math.max(0, percent)))\n  return progress.get(articleId)\n}",
                        "JavaScript", "public", "published", null, now.minus(6, ChronoUnit.DAYS), now, 318,
                        new LinkedHashSet<>(Set.of("technology", "reading"))
                ));
            }
        };
    }

    private void seedTag(TagRepository tags, String id, String name) {
        if (!tags.existsById(id)) tags.save(new TagEntity(id, name));
    }
}
