package com.planguage.history.service;

import com.planguage.history.compiler.grpc.ExecutionChunk;
import com.planguage.history.compiler.grpc.ExecutionRequest;
import com.planguage.history.compiler.grpc.ExecutionResponse;
import com.planguage.history.compiler.grpc.ExecutionServiceGrpc;
import com.planguage.history.dto.compiler.ExecuteRequestDto;
import com.planguage.history.dto.compiler.ExecuteResponseDto;
import com.google.protobuf.ByteString;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Collections;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompilerService {

    private final ExecutionServiceGrpc.ExecutionServiceBlockingStub blockingStub;
    private final ExecutionServiceGrpc.ExecutionServiceStub asyncStub;

    @Value("${compiler.cache.enabled:true}")
    private boolean cacheEnabled;

    @Value("${compiler.rate-limit.max-requests-per-minute:15}")
    private int maxRequestsPerMinute;

    private static final int MAX_CODE_BYTES = 65536; // 64 KB limit

    // Simple thread-safe in-memory cache for deterministic compilation results
    private final Map<String, CacheEntry> executionCache = new ConcurrentHashMap<>();

    // IP-based sliding window rate limiter
    private final Map<String, RateLimitTracker> rateLimiters = new ConcurrentHashMap<>();

    private record CacheEntry(ExecuteResponseDto response, long timestampMs) {}

    private static class RateLimitTracker {
        long windowStartMs = System.currentTimeMillis();
        AtomicInteger counter = new AtomicInteger(0);

        synchronized boolean allowRequest(int maxPerMinute) {
            long now = System.currentTimeMillis();
            if (now - windowStartMs > 60_000) {
                windowStartMs = now;
                counter.set(0);
            }
            return counter.incrementAndGet() <= maxPerMinute;
        }
    }

    public ExecuteResponseDto executeCode(ExecuteRequestDto request, String clientIp) {
        validateRequest(request);
        enforceRateLimit(clientIp);

        String cacheKey = computeCacheKey(request);
        if (cacheEnabled) {
            CacheEntry cached = executionCache.get(cacheKey);
            if (cached != null && (System.currentTimeMillis() - cached.timestampMs()) < 3600_000) {
                log.info("Serving execution result from cache for language: {}", request.getLanguageId());
                ExecuteResponseDto res = cached.response();
                return ExecuteResponseDto.builder()
                        .exitCode(res.getExitCode())
                        .stdout(res.getStdout())
                        .stderr(res.getStderr())
                        .compileTimeMs(res.getCompileTimeMs())
                        .executionTimeMs(res.getExecutionTimeMs())
                        .peakMemoryBytes(res.getPeakMemoryBytes())
                        .timedOut(res.isTimedOut())
                        .cached(true)
                        .build();
            }
        }

        int timeout = request.getTimeoutMs() != null ? Math.min(Math.max(request.getTimeoutMs(), 500), 5000) : 3000;

        ExecutionRequest grpcRequest = ExecutionRequest.newBuilder()
                .setLanguageId(request.getLanguageId())
                .setSourceCode(request.getSourceCode())
                .addAllCompilerFlags(request.getCompilerFlags() != null ? request.getCompilerFlags() : Collections.emptyList())
                .setStdinInput(request.getStdinInput() != null ? request.getStdinInput() : "")
                .setTimeoutMs(timeout)
                .build();

        try {
            ExecutionResponse grpcResponse = blockingStub
                    .withDeadlineAfter(timeout + 5000L, TimeUnit.MILLISECONDS)
                    .executeCode(grpcRequest);

            ExecuteResponseDto dto = ExecuteResponseDto.builder()
                    .exitCode(grpcResponse.getExitCode())
                    .stdout(grpcResponse.getStdout())
                    .stderr(grpcResponse.getStderr())
                    .compileTimeMs(grpcResponse.getCompileTimeMs())
                    .executionTimeMs(grpcResponse.getExecutionTimeMs())
                    .peakMemoryBytes(grpcResponse.getPeakMemoryBytes())
                    .timedOut(grpcResponse.getTimedOut())
                    .cached(false)
                    .build();

            // Cache deterministic successful execution runs
            if (cacheEnabled && dto.getExitCode() == 0 && !dto.isTimedOut()) {
                executionCache.put(cacheKey, new CacheEntry(dto, System.currentTimeMillis()));
            }

            return dto;
        } catch (Exception e) {
            log.error("gRPC execution failed for language {}: {}", request.getLanguageId(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Compiler daemon execution failed: " + e.getMessage());
        }
    }

    public SseEmitter streamExecution(ExecuteRequestDto request, String clientIp) {
        validateRequest(request);
        enforceRateLimit(clientIp);

        SseEmitter emitter = new SseEmitter(15000L); // 15s timeout
        int timeout = request.getTimeoutMs() != null ? Math.min(Math.max(request.getTimeoutMs(), 500), 5000) : 3000;

        ExecutionRequest grpcRequest = ExecutionRequest.newBuilder()
                .setLanguageId(request.getLanguageId())
                .setSourceCode(request.getSourceCode())
                .addAllCompilerFlags(request.getCompilerFlags() != null ? request.getCompilerFlags() : Collections.emptyList())
                .setStdinInput(request.getStdinInput() != null ? request.getStdinInput() : "")
                .setTimeoutMs(timeout)
                .build();

        asyncStub.streamExecution(grpcRequest, new StreamObserver<>() {
            @Override
            public void onNext(ExecutionChunk chunk) {
                try {
                    Map<String, String> payload = Map.of(
                            "type", chunk.getType().name(),
                            "data", chunk.getData().toStringUtf8()
                    );
                    emitter.send(SseEmitter.event().data(payload));
                } catch (Exception ex) {
                    log.warn("Failed to push SSE event: {}", ex.getMessage());
                }
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error during execution streaming: {}", t.getMessage());
                emitter.completeWithError(t);
            }

            @Override
            public void onCompleted() {
                emitter.complete();
            }
        });

        return emitter;
    }

    private void validateRequest(ExecuteRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Execution request body is required");
        }
        if (request.getLanguageId() == null || request.getLanguageId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "languageId is required");
        }
        if (request.getSourceCode() == null || request.getSourceCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sourceCode is required");
        }
        if (request.getSourceCode().getBytes(StandardCharsets.UTF_8).length > MAX_CODE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sourceCode exceeds 64 KB limit");
        }
    }

    private void enforceRateLimit(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            clientIp = "127.0.0.1";
        }
        RateLimitTracker tracker = rateLimiters.computeIfAbsent(clientIp, k -> new RateLimitTracker());
        if (!tracker.allowRequest(maxRequestsPerMinute)) {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Execution rate limit exceeded. Please wait a minute before running more code.");
        }
    }

    private String computeCacheKey(ExecuteRequestDto request) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String payload = request.getLanguageId() + "\n" +
                    request.getSourceCode() + "\n" +
                    (request.getCompilerFlags() != null ? String.join(" ", request.getCompilerFlags()) : "") + "\n" +
                    (request.getStdinInput() != null ? request.getStdinInput() : "");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(request.getSourceCode().hashCode());
        }
    }
}
