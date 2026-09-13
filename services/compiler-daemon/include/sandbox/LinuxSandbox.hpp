#pragma once

#include "sandbox/ISandboxEnvironment.hpp"
#include "sandbox/CGroupManager.hpp"
#include "sandbox/SeccompFilter.hpp"
#include <memory>

namespace compiler {

class LinuxSandbox : public ISandboxEnvironment {
public:
    explicit LinuxSandbox(std::string sandboxId);
    ~LinuxSandbox() override = default;

    ExecutionResult execute(const ExecutionConfig& config) override;

private:
    std::string sandboxId_;
    std::unique_ptr<CGroupManager> cgroupManager_;
};

} // namespace compiler
