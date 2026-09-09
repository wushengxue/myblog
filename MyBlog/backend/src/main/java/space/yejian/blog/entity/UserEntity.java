package space.yejian.blog.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    private String id;
    private String name;
    private String phone;
    private String idCard;
    private String email;
    private String passwordHash;
    private String bio;
    private Instant createdAt;

    protected UserEntity() {}

    public UserEntity(String id, String name, String phone, String idCard, String email, String passwordHash, String bio, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.idCard = idCard;
        this.email = email;
        this.passwordHash = passwordHash;
        this.bio = bio;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getIdCard() { return idCard; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getBio() { return bio; }
    public Instant getCreatedAt() { return createdAt; }
}
