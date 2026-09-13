package com.planguage.history.controller;

import com.planguage.history.dto.compiler.ExecuteRequestDto;
import com.planguage.history.dto.compiler.ExecuteResponseDto;
import com.planguage.history.service.CompilerService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/compiler")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CompilerController {

    private final CompilerService compilerService;

    @PostMapping("/execute")
    public ResponseEntity<ExecuteResponseDto> executeCode(
            @RequestBody ExecuteRequestDto request,
            HttpServletRequest servletRequest) {

        String clientIp = extractClientIp(servletRequest);
        log.info("Received execution request for language: {} from IP: {}", request.getLanguageId(), clientIp);

        ExecuteResponseDto response = compilerService.executeCode(request, clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamExecution(
            @RequestBody ExecuteRequestDto request,
            HttpServletRequest servletRequest) {

        String clientIp = extractClientIp(servletRequest);
        log.info("Received streaming execution request for language: {} from IP: {}", request.getLanguageId(), clientIp);

        return compilerService.streamExecution(request, clientIp);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "compiler-gateway",
                "supportedLanguages", java.util.List.of("c", "cpp", "python")
        ));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
