#include "sandbox/HostSandbox.hpp"
#include <chrono>
#include <iostream>
#include <sstream>
#include <thread>
#include <vector>

#if defined(_WIN32) || defined(_WIN64)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <psapi.h>
#else
#include <unistd.h>
#include <sys/wait.h>
#include <sys/types.h>
#include <sys/resource.h>
#include <poll.h>
#include <fcntl.h>
#include <signal.h>
#endif

namespace compiler {

ExecutionResult HostSandbox::execute(const ExecutionConfig& config) {
    ExecutionResult result;
    auto startTime = std::chrono::steady_clock::now();

#if defined(_WIN32) || defined(_WIN64)
    // Build full command line string
    std::string cmdLine = config.command;
    for (const auto& arg : config.args) {
        cmdLine += " \"" + arg + "\"";
    }

    SECURITY_ATTRIBUTES sa;
    sa.nLength = sizeof(SECURITY_ATTRIBUTES);
    sa.bInheritHandle = TRUE;
    sa.lpSecurityDescriptor = nullptr;

    HANDLE stdoutRead = nullptr, stdoutWrite = nullptr;
    HANDLE stderrRead = nullptr, stderrWrite = nullptr;
    HANDLE stdinRead = nullptr, stdinWrite = nullptr;

    if (!CreatePipe(&stdoutRead, &stdoutWrite, &sa, 0) ||
        !CreatePipe(&stderrRead, &stderrWrite, &sa, 0) ||
        !CreatePipe(&stdinRead, &stdinWrite, &sa, 0)) {
        result.exitCode = -1;
        result.stderrData = "Failed to create I/O pipes";
        return result;
    }

    SetHandleInformation(stdoutRead, HANDLE_FLAG_INHERIT, 0);
    SetHandleInformation(stderrRead, HANDLE_FLAG_INHERIT, 0);
    SetHandleInformation(stdinWrite, HANDLE_FLAG_INHERIT, 0);

    // Provide stdin data if any
    if (!config.stdinData.empty()) {
        DWORD written = 0;
        WriteFile(stdinWrite, config.stdinData.c_str(), 
                  static_cast<DWORD>(config.stdinData.size()), &written, nullptr);
    }
    CloseHandle(stdinWrite);
    stdinWrite = nullptr;

    STARTUPINFOA si;
    ZeroMemory(&si, sizeof(STARTUPINFOA));
    si.cb = sizeof(STARTUPINFOA);
    si.hStdError = stderrWrite;
    si.hStdOutput = stdoutWrite;
    si.hStdInput = stdinRead;
    si.dwFlags |= STARTF_USESTDHANDLES;

    PROCESS_INFORMATION pi;
    ZeroMemory(&pi, sizeof(PROCESS_INFORMATION));

    const char* workDir = config.workingDirectory.empty() ? nullptr : config.workingDirectory.c_str();

    std::vector<char> cmdBuffer(cmdLine.begin(), cmdLine.end());
    cmdBuffer.push_back('\0');

    BOOL success = CreateProcessA(
        nullptr,
        cmdBuffer.data(),
        nullptr,
        nullptr,
        TRUE,
        CREATE_NO_WINDOW,
        nullptr,
        workDir,
        &si,
        &pi
    );

    CloseHandle(stdoutWrite);
    CloseHandle(stderrWrite);
    CloseHandle(stdinRead);

    if (!success) {
        CloseHandle(stdoutRead);
        CloseHandle(stderrRead);
        result.exitCode = -1;
        result.stderrData = "Failed to spawn process: " + std::to_string(GetLastError());
        return result;
    }

    // Wait with timeout
    DWORD waitResult = WaitForSingleObject(pi.hProcess, config.timeoutMs);
    if (waitResult == WAIT_TIMEOUT) {
        result.timedOut = true;
        TerminateProcess(pi.hProcess, 137);
        WaitForSingleObject(pi.hProcess, 500);
    }

    // Peak memory tracking
    PROCESS_MEMORY_COUNTERS pmc;
    if (GetProcessMemoryInfo(pi.hProcess, &pmc, sizeof(pmc))) {
        result.peakMemoryBytes = static_cast<int64_t>(pmc.PeakWorkingSetSize);
    }

    DWORD rawExitCode = 0;
    GetExitCodeProcess(pi.hProcess, &rawExitCode);
    result.exitCode = static_cast<int>(rawExitCode);

    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    // Read stdout
    char buffer[4096];
    DWORD bytesRead = 0;
    while (ReadFile(stdoutRead, buffer, sizeof(buffer) - 1, &bytesRead, nullptr) && bytesRead > 0) {
        buffer[bytesRead] = '\0';
        result.stdoutData.append(buffer, bytesRead);
    }
    CloseHandle(stdoutRead);

    // Read stderr
    while (ReadFile(stderrRead, buffer, sizeof(buffer) - 1, &bytesRead, nullptr) && bytesRead > 0) {
        buffer[bytesRead] = '\0';
        result.stderrData.append(buffer, bytesRead);
    }
    CloseHandle(stderrRead);

#else
    // POSIX Implementation
    int stdoutPipe[2];
    int stderrPipe[2];
    int stdinPipe[2];

    if (pipe(stdoutPipe) < 0 || pipe(stderrPipe) < 0 || pipe(stdinPipe) < 0) {
        result.exitCode = -1;
        result.stderrData = "Failed to create pipes";
        return result;
    }

    pid_t pid = fork();
    if (pid == 0) {
        // Child process
        close(stdoutPipe[0]);
        close(stderrPipe[0]);
        close(stdinPipe[1]);

        dup2(stdoutPipe[1], STDOUT_FILENO);
        dup2(stderrPipe[1], STDERR_FILENO);
        dup2(stdinPipe[0], STDIN_FILENO);

        close(stdoutPipe[1]);
        close(stderrPipe[1]);
        close(stdinPipe[0]);

        if (!config.workingDirectory.empty()) {
            if (chdir(config.workingDirectory.c_str()) != 0) {
                _exit(127);
            }
        }

        std::vector<char*> execArgs;
        execArgs.push_back(const_cast<char*>(config.command.c_str()));
        for (const auto& arg : config.args) {
            execArgs.push_back(const_cast<char*>(arg.c_str()));
        }
        execArgs.push_back(nullptr);

        execvp(config.command.c_str(), execArgs.data());
        _exit(127);
    } else if (pid > 0) {
        // Parent process
        close(stdoutPipe[1]);
        close(stderrPipe[1]);
        close(stdinPipe[0]);

        if (!config.stdinData.empty()) {
            write(stdinPipe[1], config.stdinData.data(), config.stdinData.size());
        }
        close(stdinPipe[1]);

        // Watchdog with poll
        auto deadline = std::chrono::steady_clock::now() + std::chrono::milliseconds(config.timeoutMs);
        int status = 0;
        bool finished = false;

        while (std::chrono::steady_clock::now() < deadline) {
            pid_t res = waitpid(pid, &status, WNOHANG);
            if (res == pid) {
                finished = true;
                break;
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }

        if (!finished) {
            result.timedOut = true;
            kill(pid, SIGKILL);
            waitpid(pid, &status, 0);
        }

        if (WIFEXITED(status)) {
            result.exitCode = WEXITSTATUS(status);
        } else if (WIFSIGNALED(status)) {
            result.exitCode = 128 + WTERMSIG(status);
        }

        char buf[4096];
        ssize_t n;
        while ((n = read(stdoutPipe[0], buf, sizeof(buf) - 1)) > 0) {
            buf[n] = '\0';
            result.stdoutData.append(buf, n);
        }
        close(stdoutPipe[0]);

        while ((n = read(stderrPipe[0], buf, sizeof(buf) - 1)) > 0) {
            buf[n] = '\0';
            result.stderrData.append(buf, n);
        }
        close(stderrPipe[0]);
    } else {
        result.exitCode = -1;
        result.stderrData = "Fork failed";
        return result;
    }
#endif

    auto endTime = std::chrono::steady_clock::now();
    result.executionTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();

    return result;
}

} // namespace compiler
