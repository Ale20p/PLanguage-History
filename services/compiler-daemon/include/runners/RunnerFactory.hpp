#pragma once

#include "runners/IToolchainRunner.hpp"
#include <memory>
#include <string>

namespace compiler {

class RunnerFactory {
public:
    static std::unique_ptr<IToolchainRunner> createRunner(const std::string& languageId);
    static bool isLanguageSupported(const std::string& languageId);
};

} // namespace compiler
