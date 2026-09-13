#include "runners/ClangRunner.hpp"
#include <filesystem>
#include <fstream>
#include <random>
#include <chrono>
#include <iostream>

namespace compiler {

namespace {

std::string generateUniqueId() {
    static std::mt19937_64 rng(std::random_device{}());
    static std::uniform_int_distribution<uint64_t> dist;
    return std::to_string(dist(rng));
}

} // namespace

ClangRunner::ClangRunner(bool isCpp) : isCpp_(isCpp) {}

RunnerResponse ClangRunner::run(const RunnerRequest& request, ISandboxEnvironment& sandbox) {
    RunnerResponse response;

    // 1. Create unique ephemeral build directory
    std::string runId = "pl_run_" + generateUniqueId();
    std::filesystem::path tempDir = std::filesystem::temp_directory_path() / runId;

    try {
        std::filesystem::create_directories(tempDir);
    } catch (const std::exception& e) {
        response.exitCode = -1;
        response.stderrData = "Failed to create build directory: " + std::string(e.what());
        return response;
    }

    std::string srcExt = isCpp_ ? ".cpp" : ".c";
    std::filesystem::path sourcePath = tempDir / ("main" + srcExt);
#if defined(_WIN32) || defined(_WIN64)
    std::filesystem::path binaryPath = tempDir / "program.exe";
#else
    std::filesystem::path binaryPath = tempDir / "program";
#endif

    // 2. Write user source code to file
    {
        std::ofstream srcFile(sourcePath);
        if (!srcFile.is_open()) {
            response.exitCode = -1;
            response.stderrData = "Failed to write source file";
            std::filesystem::remove_all(tempDir);
            return response;
        }
        srcFile << request.sourceCode;
        srcFile.close();
    }

    // 3. Compile phase
    std::string compilerCmd = isCpp_ ? "g++" : "gcc";
    std::vector<std::string> compileArgs;

    if (isCpp_) {
        compileArgs.push_back("-std=c++20");
    }

    // Add user compiler flags if provided
    for (const auto& flag : request.compilerFlags) {
        compileArgs.push_back(flag);
    }

    compileArgs.push_back(sourcePath.string());
    compileArgs.push_back("-o");
    compileArgs.push_back(binaryPath.string());

    ExecutionConfig compileConfig;
    compileConfig.command = compilerCmd;
    compileConfig.args = compileArgs;
    compileConfig.workingDirectory = tempDir.string();
    compileConfig.timeoutMs = 10000; // 10s compile ceiling

    auto compileStart = std::chrono::steady_clock::now();
    ExecutionResult compileResult = sandbox.execute(compileConfig);
    auto compileEnd = std::chrono::steady_clock::now();

    response.compileTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(compileEnd - compileStart).count();

    if (compileResult.exitCode != 0 || !std::filesystem::exists(binaryPath)) {
        response.exitCode = compileResult.exitCode != 0 ? compileResult.exitCode : 1;
        response.stdoutData = compileResult.stdoutData;
        response.stderrData = compileResult.stderrData;
        try { std::filesystem::remove_all(tempDir); } catch (...) {}
        return response;
    }

    // 4. Execution phase
    ExecutionConfig runConfig;
    runConfig.command = binaryPath.string();
    runConfig.args = {};
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

    // 5. Cleanup ephemeral directory
    try {
        std::filesystem::remove_all(tempDir);
    } catch (...) {}

    return response;
}

} // namespace compiler
