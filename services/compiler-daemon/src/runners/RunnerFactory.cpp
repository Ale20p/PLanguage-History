#include "runners/RunnerFactory.hpp"
#include "runners/ClangRunner.hpp"
#include "runners/PythonRunner.hpp"
#include <algorithm>

namespace compiler {

namespace {

std::string toLower(std::string str) {
    std::transform(str.begin(), str.end(), str.begin(), [](unsigned char c) {
        return std::tolower(c);
    });
    return str;
}

} // namespace

bool RunnerFactory::isLanguageSupported(const std::string& languageId) {
    std::string lower = toLower(languageId);
    return (lower == "c" || lower == "cpp" || lower == "c++" || lower == "cplusplus" ||
            lower == "python" || lower == "py" || lower == "python3");
}

std::unique_ptr<IToolchainRunner> RunnerFactory::createRunner(const std::string& languageId) {
    std::string lower = toLower(languageId);

    if (lower == "c") {
        return std::make_unique<ClangRunner>(/*isCpp=*/false);
    } else if (lower == "cpp" || lower == "c++" || lower == "cplusplus") {
        return std::make_unique<ClangRunner>(/*isCpp=*/true);
    } else if (lower == "python" || lower == "py" || lower == "python3") {
        return std::make_unique<PythonRunner>();
    }

    return nullptr;
}

} // namespace compiler
