#pragma once

#include <string>
#include <vector>
#include <cstdint>

namespace compiler {

struct ExecutionConfig {
    std::string command;
    std::vector<std::string> args;
    std::string workingDirectory;
    std::string stdinData;
    int timeoutMs{3000};
    int64_t memoryLimitBytes{128 * 1024 * 1024}; // 128 MB default
    int maxPids{32};                              // Fork-bomb ceiling
    int cpuPercentage{50};                        // Max 50% single-core
};

struct ExecutionResult {
    int exitCode{0};
    std::string stdoutData;
    std::string stderrData;
    int64_t executionTimeMs{0};
    int64_t peakMemoryBytes{0};
    bool timedOut{false};
};

class ISandboxEnvironment {
public:
    virtual ~ISandboxEnvironment() = default;
    virtual ExecutionResult execute(const ExecutionConfig& config) = 0;
};

} // namespace compiler
