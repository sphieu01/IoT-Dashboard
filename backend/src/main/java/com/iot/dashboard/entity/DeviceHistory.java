package com.iot.dashboard.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "device_history", indexes = {
    @Index(name = "idx_history_device", columnList = "device"),
    @Index(name = "idx_history_created_at", columnList = "createdAt")
})
public class DeviceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String device;

    @Column(nullable = false, length = 10)
    private String action; // ON, OFF

    @Column(nullable = false, length = 20)
    private String status; // ON, OFF, PENDING

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public DeviceHistory() {
        this.createdAt = LocalDateTime.now();
    }

    public DeviceHistory(String device, String action, String status, LocalDateTime createdAt) {
        this.device = device;
        this.action = action;
        this.status = status;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDevice() {
        return device;
    }

    public void setDevice(String device) {
        this.device = device;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
