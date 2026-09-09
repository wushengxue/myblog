package space.yejian.blog.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank(message = "姓名不能为空") String name,
            @NotBlank(message = "手机号不能为空") String phone,
            @NotBlank(message = "身份证号不能为空") String idCard,
            @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
            @NotBlank(message = "密码不能为空") @Size(min = 8, message = "密码至少需要 8 个字符") String password
    ) {}

    public record LoginRequest(
            @NotBlank(message = "账号不能为空") String account,
            @NotBlank(message = "密码不能为空") String password
    ) {}
}
