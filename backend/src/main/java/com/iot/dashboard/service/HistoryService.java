package com.iot.dashboard.service;

import com.iot.dashboard.dto.HistoryLogDto;
import com.iot.dashboard.entity.DeviceHistory;
import com.iot.dashboard.repository.DeviceHistoryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HistoryService {

    private final DeviceHistoryRepository historyRepository;
    private final DateTimeFormatter fullTimeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    public HistoryService(DeviceHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    // Lấy toàn bộ lịch sử bật tắt cho HistoryPage
    public List<HistoryLogDto> getAllHistoryLogs() {
        List<DeviceHistory> list = historyRepository.findAllByOrderByCreatedAtDesc();
        List<HistoryLogDto> result = new ArrayList<>();
        for (DeviceHistory h : list) {
            result.add(new HistoryLogDto(
                    h.getId(),
                    h.getDevice(),
                    h.getAction(),
                    h.getStatus(),
                    h.getCreatedAt().format(fullTimeFormatter)
            ));
        }
        return result;
    }

    // Lấy lịch sử có phân trang, tìm kiếm và lọc
    public Map<String, Object> getFilteredHistoryLogs(String query, String sort, int page, int perPage) {
        Sort sortOrder = "oldest".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Direction.ASC, "createdAt")
                : Sort.by(Sort.Direction.DESC, "createdAt");

        List<DeviceHistory> list = historyRepository.findAll(sortOrder);
        
        List<HistoryLogDto> mapped = list.stream().map(h -> new HistoryLogDto(
                h.getId(),
                h.getDevice(),
                h.getAction(),
                h.getStatus(),
                h.getCreatedAt().format(fullTimeFormatter)
        )).collect(Collectors.toList());

        // Tìm kiếm theo query
        List<HistoryLogDto> filtered = mapped.stream().filter(item -> {
            if (query == null || query.trim().isEmpty()) return true;
            String q = query.trim().toLowerCase();
            return item.getDevice().toLowerCase().contains(q) ||
                   item.getAction().toLowerCase().contains(q) ||
                   item.getStatus().toLowerCase().contains(q) ||
                   item.getFullTime().toLowerCase().contains(q);
        }).collect(Collectors.toList());

        int totalItems = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) totalItems / perPage));
        int currentPage = Math.max(1, Math.min(page, totalPages));

        int fromIndex = (currentPage - 1) * perPage;
        int toIndex = Math.min(fromIndex + perPage, totalItems);

        List<HistoryLogDto> pageData = (fromIndex <= totalItems) ? filtered.subList(fromIndex, toIndex) : Collections.emptyList();

        Map<String, Object> response = new HashMap<>();
        response.put("data", pageData);
        response.put("total", totalItems);
        response.put("page", currentPage);
        response.put("totalPages", totalPages);
        response.put("perPage", perPage);

        return response;
    }
}
