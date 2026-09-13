package com.planguage.history.dto.compiler;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecuteRequestDto {
    private String languageId;
    private String sourceCode;
    private List<String> compilerFlags;
    private String stdinInput;
    private Integer timeoutMs;
}
