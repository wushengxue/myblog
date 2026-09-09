package space.yejian.blog.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tags")
public class TagEntity {
    @Id
    private String id;
    private String name;

    protected TagEntity() {}

    public TagEntity(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public String getId() { return id; }
    public String getName() { return name; }
}
