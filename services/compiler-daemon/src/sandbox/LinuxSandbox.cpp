#include "sandbox/LinuxSandbox.hpp"
#include "sandbox/HostSandbox.hpp"
#include <iostream>
#include <chrono>
#include <thread>
#include <vector>

#ifdef __linux__
#include <sched.h>
#include <unistd.h>
#include <sys/wait.h>
#include <sys/mount.h>
#include <sys/resource.h>
#include <signal.h>
#endif

namespace compiler {

LinuxSandbox::LinuxSandbox(std::string sandboxId)
    : sandboxId_(std::move(sandboxId)),
      cgroupManager_(std::make_unique<CGroupManager>(sandboxId_)) {}

ExecutionResult LinuxSandbox::execute(const ExecutionConfig& config) {
#ifdef __linux__
    // Initialize cgroups v2 limits
    cgroupManager_->initialize(config.memoryLimitBytes, config.maxPids, config.cpuPercentage);

    ExecutionResult result;
    auto startTime = std::chrono::steady_clock::now();

    int stdoutPipe[2];
    int stderrPipe[2];
    int stdinPipe[2];

    if (pipe(stdoutPipe) < 0 || pipe(stderrPipe) < 0 || pipe(stdinPipe) < 0) {
        result.exitCode = -1;
        result.stderrData = "LinuxSandbox: Failed to create pipes";
        return result;
    }

    pid_t pid = fork();
    if (pid == 0) {
        // Child process: apply namespace isolation
        // CLONE_NEWPID: isolated PID tree
        // CLONE_NEWNET: zero network interface
        // CLONE_NEWNS: mount namespace
        // CLONE_NEWIPC: IPC isolation
        unshare(CLONE_NEWPID | CLONE_NEWNET | CLONE_NEWNS | CLONE_NEWIPC);

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

        // Apply seccomp syscall whitelist
        SeccompFilter::applySyscallFilter();

        std::vector<char*> execArgs;
        execArgs.push_back(const_cast<char*>(config.command.c_str()));
        for (const auto& arg : config.args) {
            execArgs.push_back(const_cast<char*>(arg.c_str()));
        }
        execArgs.push_back(nullptr);

        execvp(config.command.c_str(), execArgs.data());
        _exit(127);
    } else if (pid > 0) {
        // Parent process: attach child to cgroup
        cgroupManager_->attachProcess(pid);

        close(stdoutPipe[1]);
        close(stderrPipe[1]);
        close(stdinPipe[0]);

        if (!config.stdinData.empty()) {
            write(stdinPipe[1], config.stdinData.data(), config.stdinData.size());
        }
        close(stdinPipe[1]);

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

        auto endTime = std::chrono::steady_clock::now();
        result.executionTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime).count();
        return result;
    } else {
        result.exitCode = -1;
        result.stderrData = "LinuxSandbox: Fork failed";
        return result;
    }
#else
    // Delegate to HostSandbox when building outside Linux
    HostSandbox fallback;
    return fallback.execute(config);
#endif
}

} // namespace compiler
