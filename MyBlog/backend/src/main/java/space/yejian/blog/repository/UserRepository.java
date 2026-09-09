package space.yejian.blog.repository;

import space.yejian.blog.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, String> {
    Optional<UserEntity> findByPhone(String phone);
    Optional<UserEntity> findByEmailIgnoreCase(String email);
    boolean existsByPhone(String phone);
    boolean existsByEmailIgnoreCase(String email);
}
