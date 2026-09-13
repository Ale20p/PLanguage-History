package com.planguage.history.dto.compiler;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecuteResponseDto {
    private int exitCode;
    private String stdout;
    private String stderr;
    private long compileTimeMs;
    private long executionTimeMs;
    private long peakMemoryBytes;
    private boolean timedOut;
    private boolean cached;
}
