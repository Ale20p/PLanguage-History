#pragma once

#include "sandbox/ISandboxEnvironment.hpp"
#include <string>
#include <vector>
#include <memory>

namespace compiler {

struct RunnerRequest {
    std::string languageId;
    std::string sourceCode;
    std::vector<std::string> compilerFlags;
    std::string stdinInput;
    int timeoutMs{3000};
};

struct RunnerResponse {
    int exitCode{0};
    std::string stdoutData;
    std::string stderrData;
    int64_t compileTimeMs{0};
    int64_t executionTimeMs{0};
    int64_t peakMemoryBytes{0};
    bool timedOut{false};
};

class IToolchainRunner {
public:
    virtual ~IToolchainRunner() = default;
    virtual RunnerResponse run(const RunnerRequest& request, ISandboxEnvironment& sandbox) = 0;
};

} // namespace compiler
