#ifdef BUILD_GRPC_DAEMON

#include "server/CompilerServiceImpl.hpp"
#include <grpcpp/grpcpp.h>
#include <iostream>
#include <string>
#include <cstdlib>

int main(int argc, char** argv) {
    std::string port = "50051";
    const char* envPort = std::getenv("COMPILER_PORT");
    if (envPort) {
        port = envPort;
    }

    std::string serverAddress = "0.0.0.0:" + port;
    compiler::CompilerServiceImpl service;

    grpc::ServerBuilder builder;
    builder.AddListeningPort(serverAddress, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    // Set max message size to 64MB
    builder.SetMaxReceiveMessageSize(64 * 1024 * 1024);
    builder.SetMaxSendMessageSize(64 * 1024 * 1024);

    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    std::cout << "[PLanguage Compiler Daemon] Listening on " << serverAddress << std::endl;

    server->Wait();
    return 0;
}

#else

#include <iostream>

int main() {
    std::cout << "[PLanguage Compiler Daemon] Built without gRPC support. Use 'compiler-cli' for execution testing.\n";
    return 0;
}

#endif
