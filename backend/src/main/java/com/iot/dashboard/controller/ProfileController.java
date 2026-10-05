package com.iot.dashboard.controller;

import com.iot.dashboard.dto.ProfileResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile() {
        ProfileResponse profile = new ProfileResponse(
                "Đào Trung Hiếu",
                "B23DCCN298",
                "D23CNPM02",
                "Học viện Công nghệ Bưu chính Viễn thông (PTIT)",
                "Software Engineer"
        );
        return ResponseEntity.ok(profile);
    }
}
