#pragma once

#include <string>
#include <cstdint>
#include <sys/types.h>

namespace compiler {

class CGroupManager {
public:
    explicit CGroupManager(std::string groupName);
    ~CGroupManager();

    bool initialize(int64_t memoryMaxBytes, int maxPids, int cpuPercentage);
    bool attachProcess(pid_t pid);
    void cleanup();

private:
    std::string groupName_;
    std::string cgroupPath_;
    bool isInitialized_{false};
};

} // namespace compiler
