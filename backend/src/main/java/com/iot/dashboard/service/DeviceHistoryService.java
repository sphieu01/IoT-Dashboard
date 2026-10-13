package com.iot.dashboard.service;

import com.iot.dashboard.dto.DeviceHistoryDto;
import com.iot.dashboard.entity.DeviceHistory;
import com.iot.dashboard.repository.DeviceHistoryRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service // đây là nơi xử lý nghiệp vụ, Spring sẽ tự động tạo và quản lý đối tượng này
public class DeviceHistoryService {

    private final DeviceHistoryRepository historyRepository; // k cần historyRepository = new DeviceHistoryRepository()
    private final DateTimeFormatter fullTimeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    public DeviceHistoryService(DeviceHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    // Lấy toàn bộ lịch sử bật tắt cho HistoryPage (không phân trang)
    public List<DeviceHistoryDto> getAllHistoryLogs() {
        List<DeviceHistory> list = historyRepository.findAllByOrderByExecutedAtDesc(); // list này chưa được định dạng
                                                                                       // chuẩn
        List<DeviceHistoryDto> result = new ArrayList<>(); // chứa định dạng chuẩn
        for (DeviceHistory h : list) {
            result.add(new DeviceHistoryDto(
                    h.getId(),
                    h.getDevice() != null ? h.getDevice().getName() : "",
                    h.getAction(),
                    h.getStatus(),
                    h.getExecutedAt().format(fullTimeFormatter)));
        }
        return result;
    }

    // Lấy lịch sử có phân trang, tìm kiếm và lọc đa trường
    public Map<String, Object> getFilteredHistoryLogs(String device, String action, String status, String query, String sort, int page, int perPage) {
        Sort sortOrder = "oldest".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Direction.ASC, "executedAt")
                : Sort.by(Sort.Direction.DESC, "executedAt");

        // Giới hạn cứng 1000 bản ghi từ DB
        final int MAX_FETCH = 1000;
        Pageable pageable = PageRequest.of(0, MAX_FETCH, sortOrder);
        List<DeviceHistory> list = historyRepository.findAll(pageable).getContent();

        List<DeviceHistoryDto> mapped = list.stream().map(h -> new DeviceHistoryDto(
                h.getId(),
                h.getDevice() != null ? h.getDevice().getName() : "",
                h.getAction(),
                h.getStatus(),
                h.getExecutedAt().format(fullTimeFormatter))).collect(Collectors.toList());

        // Lọc theo device, action, status và query
        List<DeviceHistoryDto> filtered = mapped.stream().filter(item -> {
            if (device != null && !device.trim().isEmpty() && !"all".equalsIgnoreCase(device)) {
                if (!device.equalsIgnoreCase(item.getDevice())) return false;
            }
            if (action != null && !action.trim().isEmpty() && !"all".equalsIgnoreCase(action)) {
                if (!action.equalsIgnoreCase(item.getAction())) return false;
            }
            if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
                if (!status.equalsIgnoreCase(item.getStatus())) return false;
            }
            // Thanh tìm kiếm chỉ tìm theo thời gian (fullTime)
            if (query != null && !query.trim().isEmpty()) {
                String q = query.trim().toLowerCase();
                if (!item.getFullTime().toLowerCase().contains(q)) {
                    return false;
                }
            }
            return true;
        }).collect(Collectors.toList());

        if (filtered.size() > MAX_FETCH) {
            filtered = filtered.subList(0, MAX_FETCH);
        }

        int pageSize = Math.min(Math.max(perPage, 1), MAX_FETCH);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / pageSize));
        int safePage = Math.min(Math.max(page, 1), totalPages);
        int fromIndex = Math.min((safePage - 1) * pageSize, total);
        int toIndex = Math.min(fromIndex + pageSize, total);

        List<DeviceHistoryDto> pagedData = filtered.subList(fromIndex, toIndex);

        Map<String, Object> response = new HashMap<>();
        response.put("data", pagedData);
        response.put("total", total);
        response.put("totalPages", totalPages);
        response.put("currentPage", safePage);

        return response;
    }

    // Overload tương thích ngược
    public Map<String, Object> getFilteredHistoryLogs(String query, String sort, int page, int perPage) {
        return getFilteredHistoryLogs(null, null, null, query, sort, page, perPage);
    }
}
