#include "runners/RunnerFactory.hpp"
#include "sandbox/HostSandbox.hpp"
#include "sandbox/LinuxSandbox.hpp"
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

void printUsage() {
    std::cout << "Usage: compiler-cli --lang <c|cpp|python> --code \"<source_code>\" [--input \"<stdin>\"] [--timeout <ms>]\n";
    std::cout << "Example: compiler-cli --lang cpp --code \"#include <iostream>\\nint main() { std::cout << \\\"Hello\\\"; return 0; }\"\n";
}

int main(int argc, char* argv[]) {
    std::string languageId;
    std::string sourceCode;
    std::string sourceFile;
    std::string stdinInput;
    int timeoutMs = 3000;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--lang" && i + 1 < argc) {
            languageId = argv[++i];
        } else if (arg == "--code" && i + 1 < argc) {
            sourceCode = argv[++i];
        } else if (arg == "--file" && i + 1 < argc) {
            sourceFile = argv[++i];
        } else if (arg == "--input" && i + 1 < argc) {
            stdinInput = argv[++i];
        } else if (arg == "--timeout" && i + 1 < argc) {
            timeoutMs = std::stoi(argv[++i]);
        } else if (arg == "--help" || arg == "-h") {
            printUsage();
            return 0;
        }
    }

    if (!sourceFile.empty()) {
        std::ifstream f(sourceFile);
        if (f.is_open()) {
            std::stringstream ss;
            ss << f.rdbuf();
            sourceCode = ss.str();
        } else {
            std::cerr << "Error: Could not open file: " << sourceFile << "\n";
            return 1;
        }
    }

    if (languageId.empty() || sourceCode.empty()) {
        std::cerr << "Error: --lang and (--code or --file) arguments are required.\n\n";
        printUsage();
        return 1;
    }

    if (!compiler::RunnerFactory::isLanguageSupported(languageId)) {
        std::cerr << "Error: Language '" << languageId << "' is not supported.\n";
        return 1;
    }

    auto runner = compiler::RunnerFactory::createRunner(languageId);
    if (!runner) {
        std::cerr << "Error: Could not instantiate runner for language: " << languageId << "\n";
        return 1;
    }

    compiler::RunnerRequest request;
    request.languageId = languageId;
    request.sourceCode = sourceCode;
    request.stdinInput = stdinInput;
    request.timeoutMs = timeoutMs;

#ifdef __linux__
    compiler::LinuxSandbox sandbox("cli_session");
#else
    compiler::HostSandbox sandbox;
#endif

    std::cout << "=== Compiling & Executing (" << languageId << ") ===\n";
    compiler::RunnerResponse response = runner->run(request, sandbox);

    std::cout << "Exit Code:       " << response.exitCode << "\n";
    std::cout << "Timed Out:       " << (response.timedOut ? "true" : "false") << "\n";
    std::cout << "Compile Time:    " << response.compileTimeMs << " ms\n";
    std::cout << "Execution Time:  " << response.executionTimeMs << " ms\n";
    std::cout << "Peak Memory:     " << (response.peakMemoryBytes / 1024) << " KB\n";

    std::cout << "\n--- STDOUT ---\n" << response.stdoutData;
    if (!response.stderrData.empty()) {
        std::cout << "\n--- STDERR ---\n" << response.stderrData;
    }
    std::cout << "\n";

    return response.exitCode;
}
