package com.iot.dashboard.controller;

import com.iot.dashboard.dto.HistoryLogDto;
import com.iot.dashboard.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    // Lấy toàn bộ hoặc danh sách có tìm kiếm, lọc, phân trang
    @GetMapping
    public ResponseEntity<?> getHistory(
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit
    ) {
        if (page != null && limit != null) {
            Map<String, Object> result = historyService.getFilteredHistoryLogs(query, sort, page, limit);
            return ResponseEntity.ok(result);
        }
        List<HistoryLogDto> list = historyService.getAllHistoryLogs();
        return ResponseEntity.ok(list);
    }
}
