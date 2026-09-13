#pragma once

#include "sandbox/ISandboxEnvironment.hpp"

namespace compiler {

class HostSandbox : public ISandboxEnvironment {
public:
    HostSandbox() = default;
    ~HostSandbox() override = default;

    ExecutionResult execute(const ExecutionConfig& config) override;
};

} // namespace compiler
