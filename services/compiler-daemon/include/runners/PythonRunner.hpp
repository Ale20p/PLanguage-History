#pragma once

#include "runners/IToolchainRunner.hpp"

namespace compiler {

class PythonRunner : public IToolchainRunner {
public:
    PythonRunner() = default;
    ~PythonRunner() override = default;

    RunnerResponse run(const RunnerRequest& request, ISandboxEnvironment& sandbox) override;
};

} // namespace compiler
