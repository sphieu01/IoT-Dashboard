package com.iot.dashboard.service;

import com.iot.dashboard.dto.DeviceHistoryDto;
import com.iot.dashboard.entity.DeviceHistory;
import com.iot.dashboard.repository.DeviceHistoryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeviceHistoryService {

    private final DeviceHistoryRepository historyRepository;
    private final DateTimeFormatter fullTimeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    public DeviceHistoryService(DeviceHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    // Lấy toàn bộ lịch sử bật tắt cho HistoryPage
    public List<DeviceHistoryDto> getAllHistoryLogs() {
        List<DeviceHistory> list = historyRepository.findAllByOrderByExecutedAtDesc();
        List<DeviceHistoryDto> result = new ArrayList<>();
        for (DeviceHistory h : list) {
            result.add(new DeviceHistoryDto(
                    h.getId(),
                    h.getDevice() != null ? h.getDevice().getName() : "",
                    h.getAction(),
                    h.getStatus(),
                    h.getExecutedAt().format(fullTimeFormatter)
            ));
        }
        return result;
    }

    // Lấy lịch sử có phân trang, tìm kiếm và lọc
    public Map<String, Object> getFilteredHistoryLogs(String query, String sort, int page, int perPage) {
        Sort sortOrder = "oldest".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Direction.ASC, "executedAt")
                : Sort.by(Sort.Direction.DESC, "executedAt");

        List<DeviceHistory> list = historyRepository.findAll(sortOrder);
        
        List<DeviceHistoryDto> mapped = list.stream().map(h -> new DeviceHistoryDto(
                h.getId(),
                h.getDevice() != null ? h.getDevice().getName() : "",
                h.getAction(),
                h.getStatus(),
                h.getExecutedAt().format(fullTimeFormatter)
        )).collect(Collectors.toList());

        // Tìm kiếm theo query
        List<DeviceHistoryDto> filtered = mapped.stream().filter(item -> {
            if (query == null || query.trim().isEmpty()) return true;
            String q = query.trim().toLowerCase();
            return item.getDevice().toLowerCase().contains(q) ||
                   item.getAction().toLowerCase().contains(q) ||
                   item.getStatus().toLowerCase().contains(q) ||
                   item.getFullTime().toLowerCase().contains(q);
        }).collect(Collectors.toList());

        int total = filtered.size();
        int totalPages = (int) Math.ceil((double) total / perPage);
        int fromIndex = Math.min((page - 1) * perPage, total);
        int toIndex = Math.min(fromIndex + perPage, total);

        List<DeviceHistoryDto> pagedData = filtered.subList(fromIndex, toIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("data", pagedData);
        response.put("total", total);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);

        return response;
    }
}
