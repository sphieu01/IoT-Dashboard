package com.iot.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class DeviceToggleRequest {

    @JsonAlias({"deviceName", "device_name"})
    private String device; // "Light" | "Fan"

    private String action; // "ON" | "OFF"

    @JsonProperty("device_id")
    @JsonAlias({"deviceId"})
    private Integer deviceId;

    public DeviceToggleRequest() {}

    public DeviceToggleRequest(String device, String action) {
        this.device = device;
        this.action = action;
    }

    public String getDevice() {
        if (device != null && !device.trim().isEmpty()) {
            return device;
        }
        if (deviceId != null) {
            return deviceId == 1 ? "Light" : (deviceId == 2 ? "Fan" : "Light");
        }
        return null;
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

    public Integer getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(Integer deviceId) {
        this.deviceId = deviceId;
    }
}
