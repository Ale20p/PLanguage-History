package com.planguage.history;

import com.planguage.history.dto.compiler.ExecuteRequestDto;
import com.planguage.history.dto.compiler.ExecuteResponseDto;
import com.planguage.history.service.CompilerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CompilerIntegrationTest {

    @Autowired
    private CompilerService compilerService;

    @Test
    @DisplayName("Should execute C++ code via gRPC to Compiler Daemon")
    void testExecuteCppCode() {
        ExecuteRequestDto request = ExecuteRequestDto.builder()
                .languageId("cpp")
                .sourceCode("""
                        #include <iostream>
                        int main() {
                            std::cout << "gRPC C++ Test Success" << std::endl;
                            return 0;
                        }
                        """)
                .timeoutMs(5000)
                .build();

        ExecuteResponseDto response = compilerService.executeCode(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals(0, response.getExitCode());
        assertFalse(response.isTimedOut());
        assertNotNull(response.getStdout());
        assertTrue(response.getStdout().contains("gRPC C++ Test Success"), "Stdout should contain expected string");
        assertFalse(response.isCached());
    }

    @Test
    @DisplayName("Should execute Python code via gRPC to Compiler Daemon")
    void testExecutePythonCode() {
        ExecuteRequestDto request = ExecuteRequestDto.builder()
                .languageId("python")
                .sourceCode("print('gRPC Python Test Success')")
                .timeoutMs(3000)
                .build();

        ExecuteResponseDto response = compilerService.executeCode(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals(0, response.getExitCode());
        assertFalse(response.isTimedOut());
        assertNotNull(response.getStdout());
        assertTrue(response.getStdout().contains("gRPC Python Test Success"));
    }

    @Test
    @DisplayName("Should return cached execution on duplicate identical request")
    void testCachingBehavior() {
        ExecuteRequestDto request = ExecuteRequestDto.builder()
                .languageId("python")
                .sourceCode("print('deterministic_cache_test_99')")
                .timeoutMs(3000)
                .build();

        ExecuteResponseDto firstRun = compilerService.executeCode(request, "127.0.0.1");
        assertFalse(firstRun.isCached());

        ExecuteResponseDto secondRun = compilerService.executeCode(request, "127.0.0.1");
        assertTrue(secondRun.isCached());
        assertEquals(firstRun.getStdout(), secondRun.getStdout());
    }
}
