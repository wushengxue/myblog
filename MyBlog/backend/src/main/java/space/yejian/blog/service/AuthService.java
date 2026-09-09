package space.yejian.blog.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import space.yejian.blog.dto.AuthDtos;
import space.yejian.blog.dto.CommonDtos;
import space.yejian.blog.entity.UserEntity;
import space.yejian.blog.exception.ApiException;
import space.yejian.blog.repository.UserRepository;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    public CommonDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        String phone = request.phone().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByPhone(phone) || users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "手机号或邮箱已注册");
        }
        UserEntity user = new UserEntity(
                "user-" + UUID.randomUUID(),
                request.name().trim(),
                phone,
                request.idCard().trim().toUpperCase(Locale.ROOT),
                email,
                passwordEncoder.encode(request.password()),
                request.name().trim() + " 的页间记录。",
                Instant.now()
        );
        users.save(user);
        return response(user);
    }

    public CommonDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        String account = request.account().trim();
        UserEntity user = account.contains("@")
                ? users.findByEmailIgnoreCase(account).orElse(null)
                : users.findByPhone(account).orElse(null);
        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "账号或密码错误，请检查后重试");
        }
        return response(user);
    }

    public UserEntity requireUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "请先登录");
        }
        return users.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "登录状态已失效，请重新登录"));
    }

    public UserEntity findUser(String userId) {
        return users.findById(userId).orElse(null);
    }

    public CommonDtos.UserView toView(UserEntity user) {
        return new CommonDtos.UserView(user.getId(), user.getName(), user.getPhone(), user.getEmail(), user.getBio());
    }

    private CommonDtos.AuthResponse response(UserEntity user) {
        return new CommonDtos.AuthResponse(toView(user), user.getId());
    }
}
