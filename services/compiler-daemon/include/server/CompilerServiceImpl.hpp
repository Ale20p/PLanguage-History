#pragma once

#ifdef BUILD_GRPC_DAEMON
#include "compiler.grpc.pb.h"
#include <grpcpp/grpcpp.h>

namespace compiler {

class CompilerServiceImpl final : public com::planguage::history::compiler::ExecutionService::Service {
public:
    CompilerServiceImpl() = default;
    ~CompilerServiceImpl() override = default;

    grpc::Status ExecuteCode(
        grpc::ServerContext* context,
        const com::planguage::history::compiler::ExecutionRequest* request,
        com::planguage::history::compiler::ExecutionResponse* response) override;

    grpc::Status StreamExecution(
        grpc::ServerContext* context,
        const com::planguage::history::compiler::ExecutionRequest* request,
        grpc::ServerWriter<com::planguage::history::compiler::ExecutionChunk>* writer) override;
};

} // namespace compiler

#endif // BUILD_GRPC_DAEMON
