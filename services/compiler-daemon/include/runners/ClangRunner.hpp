#pragma once

#include "runners/IToolchainRunner.hpp"

namespace compiler {

class ClangRunner : public IToolchainRunner {
public:
    explicit ClangRunner(bool isCpp = true);
    ~ClangRunner() override = default;

    RunnerResponse run(const RunnerRequest& request, ISandboxEnvironment& sandbox) override;

private:
    bool isCpp_{true};
};

} // namespace compiler
