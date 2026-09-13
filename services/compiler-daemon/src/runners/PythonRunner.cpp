#include "runners/PythonRunner.hpp"
#include <filesystem>
#include <fstream>
#include <random>
#include <chrono>

namespace compiler {

namespace {

std::string generateUniqueId() {
    static std::mt19937_64 rng(std::random_device{}());
    static std::uniform_int_distribution<uint64_t> dist;
    return std::to_string(dist(rng));
}

} // namespace

RunnerResponse PythonRunner::run(const RunnerRequest& request, ISandboxEnvironment& sandbox) {
    RunnerResponse response;

    // 1. Create unique ephemeral run directory
    std::string runId = "pl_py_" + generateUniqueId();
    std::filesystem::path tempDir = std::filesystem::temp_directory_path() / runId;

    try {
        std::filesystem::create_directories(tempDir);
    } catch (const std::exception& e) {
        response.exitCode = -1;
        response.stderrData = "Failed to create runtime directory: " + std::string(e.what());
        return response;
    }

    std::filesystem::path scriptPath = tempDir / "script.py";

    // 2. Write Python script
    {
        std::ofstream scriptFile(scriptPath);
        if (!scriptFile.is_open()) {
            response.exitCode = -1;
            response.stderrData = "Failed to write script file";
            std::filesystem::remove_all(tempDir);
            return response;
        }
        scriptFile << request.sourceCode;
        scriptFile.close();
    }

    // 3. Execution configuration
#if defined(_WIN32) || defined(_WIN64)
    std::string pythonCmd = "python";
#else
    std::string pythonCmd = "python3";
#endif

    ExecutionConfig runConfig;
    runConfig.command = pythonCmd;
    runConfig.args = { "-u", scriptPath.string() }; // -u for unbuffered I/O
    runConfig.workingDirectory = tempDir.string();
    runConfig.stdinData = request.stdinInput;
    runConfig.timeoutMs = request.timeoutMs > 0 ? request.timeoutMs : 3000;

    ExecutionResult runResult = sandbox.execute(runConfig);

    response.exitCode = runResult.exitCode;
    response.stdoutData = runResult.stdoutData;
    response.stderrData = runResult.stderrData;
    response.executionTimeMs = runResult.executionTimeMs;
    response.peakMemoryBytes = runResult.peakMemoryBytes;
    response.timedOut = runResult.timedOut;
    response.compileTimeMs = 0; // Interpreted

    // 4. Cleanup
    try {
        std::filesystem::remove_all(tempDir);
    } catch (...) {}

    return response;
}

} // namespace compiler
