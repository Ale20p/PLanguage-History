#include "sandbox/CGroupManager.hpp"
#include <iostream>
#include <fstream>
#include <filesystem>

#ifdef __linux__
#include <unistd.h>
#include <sys/stat.h>
#endif

namespace compiler {

CGroupManager::CGroupManager(std::string groupName)
    : groupName_(std::move(groupName)) {
#ifdef __linux__
    cgroupPath_ = "/sys/fs/cgroup/compiler_" + groupName_;
#else
    cgroupPath_ = "mock_cgroup_" + groupName_;
#endif
}

CGroupManager::~CGroupManager() {
    cleanup();
}

bool CGroupManager::initialize(int64_t memoryMaxBytes, int maxPids, int cpuPercentage) {
#ifdef __linux__
    try {
        std::filesystem::create_directories(cgroupPath_);

        // 1. Memory hard limit
        std::ofstream memFile(cgroupPath_ + "/memory.max");
        if (memFile.is_open()) {
            memFile << memoryMaxBytes << "\n";
            memFile.close();
        }

        // 2. PID ceiling (defeat fork-bombs)
        std::ofstream pidsFile(cgroupPath_ + "/pids.max");
        if (pidsFile.is_open()) {
            pidsFile << maxPids << "\n";
            pidsFile.close();
        }

        // 3. CPU quota (50% of 1 core = "50000 100000")
        std::ofstream cpuFile(cgroupPath_ + "/cpu.max");
        if (cpuFile.is_open()) {
            int64_t quota = cpuPercentage * 1000;
            cpuFile << quota << " 100000\n";
            cpuFile.close();
        }

        isInitialized_ = true;
        return true;
    } catch (const std::exception& e) {
        std::cerr << "[CGroupManager] Failed to init cgroup at " << cgroupPath_ 
                  << ": " << e.what() << "\n";
        return false;
    }
#else
    // Host fallback for non-Linux platforms
    isInitialized_ = true;
    return true;
#endif
}

bool CGroupManager::attachProcess(pid_t pid) {
#ifdef __linux__
    if (!isInitialized_) return false;
    std::ofstream procsFile(cgroupPath_ + "/cgroup.procs");
    if (procsFile.is_open()) {
        procsFile << pid << "\n";
        procsFile.close();
        return true;
    }
    return false;
#else
    (void)pid;
    return true;
#endif
}

void CGroupManager::cleanup() {
#ifdef __linux__
    if (isInitialized_ && std::filesystem::exists(cgroupPath_)) {
        try {
            std::filesystem::remove(cgroupPath_);
        } catch (...) {}
        isInitialized_ = false;
    }
#else
    isInitialized_ = false;
#endif
}

} // namespace compiler
