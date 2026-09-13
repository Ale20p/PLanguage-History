#ifdef BUILD_GRPC_DAEMON

#include "server/CompilerServiceImpl.hpp"
#include "runners/RunnerFactory.hpp"
#include "sandbox/HostSandbox.hpp"
#include "sandbox/LinuxSandbox.hpp"
#include <iostream>

namespace compiler {

grpc::Status CompilerServiceImpl::ExecuteCode(
    grpc::ServerContext* /*context*/,
    const com::planguage::history::compiler::ExecutionRequest* request,
    com::planguage::history::compiler::ExecutionResponse* response) {

    if (!RunnerFactory::isLanguageSupported(request->language_id())) {
        return grpc::Status(grpc::StatusCode::INVALID_ARGUMENT, 
            "Unsupported language: " + request->language_id());
    }

    auto runner = RunnerFactory::createRunner(request->language_id());
    if (!runner) {
        return grpc::Status(grpc::StatusCode::INTERNAL, 
            "Failed to initialize runner for language: " + request->language_id());
    }

    RunnerRequest req;
    req.languageId = request->language_id();
    req.sourceCode = request->source_code();
    for (int i = 0; i < request->compiler_flags_size(); ++i) {
        req.compilerFlags.push_back(request->compiler_flags(i));
    }
    req.stdinInput = request->stdin_input();
    req.timeoutMs = request->timeout_ms() > 0 ? request->timeout_ms() : 3000;

#ifdef __linux__
    LinuxSandbox sandbox("grpc_session");
#else
    HostSandbox sandbox;
#endif

    RunnerResponse res = runner->run(req, sandbox);

    response->set_exit_code(res.exitCode);
    response->set_stdout(res.stdoutData);
    response->set_stderr(res.stderrData);
    response->set_compile_time_ms(res.compileTimeMs);
    response->set_execution_time_ms(res.executionTimeMs);
    response->set_peak_memory_bytes(res.peakMemoryBytes);
    response->set_timed_out(res.timedOut);

    return grpc::Status::OK;
}

grpc::Status CompilerServiceImpl::StreamExecution(
    grpc::ServerContext* /*context*/,
    const com::planguage::history::compiler::ExecutionRequest* request,
    grpc::ServerWriter<com::planguage::history::compiler::ExecutionChunk>* writer) {

    if (!RunnerFactory::isLanguageSupported(request->language_id())) {
        return grpc::Status(grpc::StatusCode::INVALID_ARGUMENT, 
            "Unsupported language: " + request->language_id());
    }

    auto runner = RunnerFactory::createRunner(request->language_id());
    if (!runner) {
        return grpc::Status(grpc::StatusCode::INTERNAL, 
            "Failed to initialize runner for language: " + request->language_id());
    }

    // 1. Send initial status
    com::planguage::history::compiler::ExecutionChunk chunk;
    chunk.set_type(com::planguage::history::compiler::ExecutionChunk::STATUS);
    chunk.set_data("Allocating sandbox environment...");
    writer->Write(chunk);

    RunnerRequest req;
    req.languageId = request->language_id();
    req.sourceCode = request->source_code();
    for (int i = 0; i < request->compiler_flags_size(); ++i) {
        req.compilerFlags.push_back(request->compiler_flags(i));
    }
    req.stdinInput = request->stdin_input();
    req.timeoutMs = request->timeout_ms() > 0 ? request->timeout_ms() : 3000;

#ifdef __linux__
    LinuxSandbox sandbox("grpc_stream");
#else
    HostSandbox sandbox;
#endif

    chunk.set_type(com::planguage::history::compiler::ExecutionChunk::STATUS);
    chunk.set_data("Executing toolchain runner...");
    writer->Write(chunk);

    RunnerResponse res = runner->run(req, sandbox);

    // 2. Stream stdout if present
    if (!res.stdoutData.empty()) {
        chunk.set_type(com::planguage::history::compiler::ExecutionChunk::STDOUT);
        chunk.set_data(res.stdoutData);
        writer->Write(chunk);
    }

    // 3. Stream stderr if present
    if (!res.stderrData.empty()) {
        chunk.set_type(com::planguage::history::compiler::ExecutionChunk::STDERR);
        chunk.set_data(res.stderrData);
        writer->Write(chunk);
    }

    // 4. Send final status
    std::string summary = "Completed with exit code " + std::to_string(res.exitCode) +
                          " (Time: " + std::to_string(res.executionTimeMs) + "ms)";
    chunk.set_type(com::planguage::history::compiler::ExecutionChunk::STATUS);
    chunk.set_data(summary);
    writer->Write(chunk);

    return grpc::Status::OK;
}

} // namespace compiler

#endif // BUILD_GRPC_DAEMON
