package com.iot.dashboard.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket // bật tính năng websocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final TelemetryWebSocketHandler webSocketHandler;

    public WebSocketConfig(TelemetryWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketHandler, "/ws", "/ws/telemetry") // Đăng ký endpoint URL để Frontend cắm kết nối
                                                                      // vào: /ws hoặc /ws/telemetry
                .setAllowedOriginPatterns("*");
    }
}
