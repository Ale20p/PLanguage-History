FROM ubuntu:24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    g++ \
    clang \
    protobuf-compiler \
    protobuf-compiler-grpc \
    libprotobuf-dev \
    libgrpc++-dev \
    libseccomp-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
RUN cmake --build build --target compiler-daemon compiler-cli -j$(nproc)

FROM ubuntu:24.04 AS runtime

ENV DEBIAN_FRONTEND=noninteractive

# Install supported language toolchains and runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    clang \
    python3 \
    libseccomp2 \
    libgrpc++1.51 \
    libprotobuf32t64 \
    netcat-openbsd \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/build/compiler-daemon /app/compiler-daemon
COPY --from=builder /app/build/compiler-cli /app/compiler-cli

ENV COMPILER_PORT=50051
EXPOSE 50051

# Run unprivileged daemon
CMD ["/app/compiler-daemon"]
