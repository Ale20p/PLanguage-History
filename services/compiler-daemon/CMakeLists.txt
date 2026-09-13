cmake_minimum_required(VERSION 3.20)
project(compiler_daemon LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

set(COMMON_SOURCES
    src/sandbox/CGroupManager.cpp
    src/sandbox/SeccompFilter.cpp
    src/sandbox/HostSandbox.cpp
    src/sandbox/LinuxSandbox.cpp
    src/runners/ClangRunner.cpp
    src/runners/PythonRunner.cpp
    src/runners/RunnerFactory.cpp
)

# Detect gRPC and Protobuf
find_package(Protobuf CONFIG QUIET)
find_package(gRPC CONFIG QUIET)

if(gRPC_FOUND AND Protobuf_FOUND)
    message(STATUS "Found gRPC and Protobuf. Enabling gRPC daemon build.")
    set(PROTO_FILE "${CMAKE_CURRENT_SOURCE_DIR}/proto/compiler.proto")
    set(PROTO_SRC_DIR "${CMAKE_CURRENT_BINARY_DIR}/generated")
    file(MAKE_DIRECTORY ${PROTO_SRC_DIR})

    set(PROTO_SRCS "${PROTO_SRC_DIR}/compiler.pb.cc")
    set(PROTO_HDRS "${PROTO_SRC_DIR}/compiler.pb.h")
    set(GRPC_SRCS "${PROTO_SRC_DIR}/compiler.grpc.pb.cc")
    set(GRPC_HDRS "${PROTO_SRC_DIR}/compiler.grpc.pb.h")

    add_custom_command(
        OUTPUT "${PROTO_SRCS}" "${PROTO_HDRS}" "${GRPC_SRCS}" "${GRPC_HDRS}"
        COMMAND protobuf::protoc
            --proto_path="${CMAKE_CURRENT_SOURCE_DIR}/proto"
            --cpp_out="${PROTO_SRC_DIR}"
            --grpc_out="${PROTO_SRC_DIR}"
            --plugin=protoc-gen-grpc=$<TARGET_FILE:gRPC::grpc_cpp_plugin>
            "${PROTO_FILE}"
        DEPENDS "${PROTO_FILE}"
    )

    include_directories(${PROTO_SRC_DIR})

    add_executable(compiler-daemon
        src/main.cpp
        src/server/CompilerServiceImpl.cpp
        ${COMMON_SOURCES}
        ${PROTO_SRCS}
        ${GRPC_SRCS}
    )
    target_compile_definitions(compiler-daemon PRIVATE BUILD_GRPC_DAEMON=1)
    target_link_libraries(compiler-daemon PRIVATE gRPC::grpc++ protobuf::libprotobuf)

    if(WIN32)
        target_link_libraries(compiler-daemon PRIVATE psapi ws2_32)
    endif()
else()
    message(STATUS "gRPC or Protobuf not found in host environment. Building stub compiler-daemon and compiler-cli.")
    add_executable(compiler-daemon
        src/main.cpp
        ${COMMON_SOURCES}
    )
    if(WIN32)
        target_link_libraries(compiler-daemon PRIVATE psapi)
    endif()
endif()

# Standalone CLI test harness (Always built)
add_executable(compiler-cli
    src/cli_main.cpp
    ${COMMON_SOURCES}
)

if(WIN32)
    target_link_libraries(compiler-cli PRIVATE psapi)
endif()
