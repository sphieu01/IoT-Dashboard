package com.iot.dashboard.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@Component // thành 1 Spring Bean
public class TelemetryWebSocketHandler extends TextWebSocketHandler { // extends TextWebSocketHandler: chuỗi văn
                                                                      // bản/JSON

    private static final Logger log = LoggerFactory.getLogger(TelemetryWebSocketHandler.class);
    private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>(); // Quản lý danh sách các trình duyệt
                                                                                // đang mở kết nối

    @Override
    public void afterConnectionEstablished(WebSocketSession session) { // Khi có người mở trang Web
        sessions.add(session);
        log.info("[WebSocket] New client connected: {}", session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) { // Khi có người đóng Tab Web
        sessions.remove(session);
        log.info("[WebSocket] Client disconnected: {}", session.getId());
    }

    public void broadcast(String message) { // Mỗi khi ESP32 bắn số đo mới lên MQTT, Backend gọi hàm này để "bắn loa" dữ
                                            // liệu lập tức tới tất cả trình duyệt đang mở để vẽ lại biểu đồ.
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    log.error("[WebSocket] Error sending message to {}: {}", session.getId(), e.getMessage());
                }
            }
        }
    }
}
