package space.yejian.blog.exception;

import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public Map<String, Object> handleApi(ApiException exception) {
        return body(exception.getStatus(), exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("请求参数不正确");
        return body(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(Exception.class)
    public Map<String, Object> handleUnknown(Exception exception) {
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "服务器处理失败，请稍后重试");
    }

    private Map<String, Object> body(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("message", message);
        return body;
    }
}
