package com.iot.dashboard.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "history", indexes = {
    @Index(name = "idx_history_device_id", columnList = "device_id"),
    @Index(name = "idx_history_executed_at", columnList = "executed_at")
})
public class DeviceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(nullable = false, length = 20)
    private String action; // ON, OFF

    @Column(nullable = false, length = 20)
    private String status; // SUCCESS, ERROR, PENDING, ON, OFF

    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;

    public DeviceHistory() {
        this.executedAt = LocalDateTime.now();
    }

    public DeviceHistory(Device device, String action, String status, LocalDateTime executedAt) {
        this.device = device;
        this.action = action;
        this.status = status;
        this.executedAt = executedAt != null ? executedAt : LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Device getDevice() {
        return device;
    }

    public void setDevice(Device device) {
        this.device = device;
    }

    // Tiện ích tương thích ngược để lấy tên thiết bị
    public String getDeviceName() {
        return device != null ? device.getName() : "";
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

    public LocalDateTime getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(LocalDateTime executedAt) {
        this.executedAt = executedAt;
    }

    // Getter/Setter tương thích ngược
    public LocalDateTime getCreatedAt() {
        return executedAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.executedAt = createdAt;
    }
}
