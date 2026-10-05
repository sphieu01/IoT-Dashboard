package com.iot.dashboard.dto;

public class HistoryLogDto {
    private Long id;
    private String device;
    private String action;
    private String status; // ON, OFF, PENDING
    private String fullTime;

    public HistoryLogDto() {}

    public HistoryLogDto(Long id, String device, String action, String status, String fullTime) {
        this.id = id;
        this.device = device;
        this.action = action;
        this.status = status;
        this.fullTime = fullTime;
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

    public String getFullTime() {
        return fullTime;
    }

    public void setFullTime(String fullTime) {
        this.fullTime = fullTime;
    }
}
