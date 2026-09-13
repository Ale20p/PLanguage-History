package com.planguage.history.config;

import com.planguage.history.compiler.grpc.ExecutionServiceGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
public class GrpcClientConfig {

    @Value("${compiler.daemon.host:localhost}")
    private String daemonHost;

    @Value("${compiler.daemon.port:50051}")
    private int daemonPort;

    private ManagedChannel channel;

    @Bean
    public ManagedChannel managedChannel() {
        log.info("Configuring gRPC ManagedChannel to Compiler Daemon at {}:{}", daemonHost, daemonPort);
        this.channel = ManagedChannelBuilder.forAddress(daemonHost, daemonPort)
                .usePlaintext()
                .maxInboundMessageSize(64 * 1024 * 1024)
                .build();
        return this.channel;
    }

    @Bean
    public ExecutionServiceGrpc.ExecutionServiceBlockingStub executionServiceBlockingStub(ManagedChannel channel) {
        return ExecutionServiceGrpc.newBlockingStub(channel);
    }

    @Bean
    public ExecutionServiceGrpc.ExecutionServiceStub executionServiceAsyncStub(ManagedChannel channel) {
        return ExecutionServiceGrpc.newStub(channel);
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            log.info("Shutting down gRPC ManagedChannel...");
            try {
                channel.shutdown().awaitTermination(3, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Channel termination interrupted", e);
            }
        }
    }
}
