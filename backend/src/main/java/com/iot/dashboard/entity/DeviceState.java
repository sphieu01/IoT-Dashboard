package com.iot.dashboard.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "devices")
public class DeviceState {

    @Id
    @Column(name = "device_key", length = 50)
    private String deviceKey; // light, fan

    @Column(nullable = false, length = 100)
    private String label; // Light, Fan

    @Column(nullable = false)
    private Boolean state; // true = ON, false = OFF

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public DeviceState() {
        this.updatedAt = LocalDateTime.now();
    }

    public DeviceState(String deviceKey, String label, Boolean state) {
        this.deviceKey = deviceKey;
        this.label = label;
        this.state = state;
        this.updatedAt = LocalDateTime.now();
    }

    public String getDeviceKey() {
        return deviceKey;
    }

    public void setDeviceKey(String deviceKey) {
        this.deviceKey = deviceKey;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Boolean getState() {
        return state;
    }

    public void setState(Boolean state) {
        this.state = state;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
