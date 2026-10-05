package com.iot.dashboard.dto;

public class DeviceToggleRequest {
    private String device; // "Light" | "Fan"
    private String action; // "ON" | "OFF"

    public DeviceToggleRequest() {}

    public DeviceToggleRequest(String device, String action) {
        this.device = device;
        this.action = action;
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
}
