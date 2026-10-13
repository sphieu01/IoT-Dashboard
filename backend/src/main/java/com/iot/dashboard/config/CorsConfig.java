package com.iot.dashboard.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration // Đánh dấu class này chứa các thiết lập hệ thống
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Cho phép tất cả các đường dẫn URL
                .allowedOriginPatterns("*") // Cho phép tất cả các domain Frontend (localhost:5173, localhost:3000, hoặc
                                            // các domain deployed sau này)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Khai báo "mở cửa" cho phép Frontend gọi
                                                                           // các method GET, POST, PUT, DELETE.
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
