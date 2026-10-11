package com.iot.dashboard.dto;

public class ProfileResponse {
    private String name;
    private String studentId;
    private String className;
    private String university;
    private String role;

    public ProfileResponse() {}

    public ProfileResponse(String name, String studentId, String className, String university, String role) {
        this.name = name;
        this.studentId = studentId;
        this.className = className;
        this.university = university;
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getUniversity() {
        return university;
    }

    public void setUniversity(String university) {
        this.university = university;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
