package com.iot.dashboard.service;

import com.iot.dashboard.dto.LoginRequest;
import com.iot.dashboard.dto.LoginResponse;
import com.iot.dashboard.dto.RegisterRequest;
import com.iot.dashboard.entity.User;
import com.iot.dashboard.repository.UserRepository;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

@Service
public class AuthService {

    private static final String SECRET_KEY = "iot-dashboard-ptit-secure-secret-token-key";
    private static final long EXPIRY_MS = 7L * 24 * 3600 * 1000; // 7 ngày

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public LoginResponse login(LoginRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Username và password không được để trống!");
        }

        User user = userRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại!"));

        // So khớp mật khẩu
        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu không chính xác!");
        }

        String token = generateToken(user.getUsername());
        return new LoginResponse(token, user.getUsername(), user.getFullName(), user.getRole());
    }

    public LoginResponse register(RegisterRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()
                || request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Username và password không được để trống!");
        }

        String uname = request.getUsername().trim();
        if (userRepository.existsByUsername(uname)) {
            throw new IllegalArgumentException("Username đã được sử dụng!");
        }

        String fullName = request.getFullName() != null && !request.getFullName().trim().isEmpty()
                ? request.getFullName().trim()
                : uname;

        User newUser = new User(uname, request.getPassword(), fullName, "ADMIN");
        newUser = userRepository.save(newUser);

        String token = generateToken(newUser.getUsername());
        return new LoginResponse(token, newUser.getUsername(), newUser.getFullName(), newUser.getRole());
    }

    public User validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }

        try {
            String decoded = new String(Base64.getUrlDecoder().decode(token.trim()), StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            if (parts.length != 3) {
                return null;
            }

            String username = parts[0];
            long expiry = Long.parseLong(parts[1]);
            String signature = parts[2];

            if (System.currentTimeMillis() > expiry) {
                return null; // Token hết hạn
            }

            String expectedSig = hmacSha256(username + ":" + expiry, SECRET_KEY);
            if (!expectedSig.equals(signature)) {
                return null; // Chữ ký không hợp lệ
            }

            return userRepository.findByUsername(username).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private String generateToken(String username) {
        long expiry = System.currentTimeMillis() + EXPIRY_MS;
        String data = username + ":" + expiry;
        String sig = hmacSha256(data, SECRET_KEY);
        String rawToken = data + ":" + sig;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(rawToken.getBytes(StandardCharsets.UTF_8));
    }

    private String hmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo chữ ký token", e);
        }
    }
}
