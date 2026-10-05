package com.iot.dashboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DashboardApplication {

    public static void main(String[] args) {
        SpringApplication.run(DashboardApplication.class, args);
        System.out.println("==============================================================");
        System.out.println("🚀 [Spring Boot] IoT Dashboard Server is RUNNING on http://localhost:5000");
        System.out.println("📊 H2 Console: http://localhost:5000/h2-console (JDBC URL: jdbc:h2:mem:iot_dashboard)");
        System.out.println("📡 WebSocket: ws://localhost:5000/ws");
        System.out.println("==============================================================");
    }
}
