#include "sandbox/SeccompFilter.hpp"
#include <iostream>

#if defined(__linux__) && defined(HAVE_SECCOMP)
#include <seccomp.h>
#include <sys/prctl.h>
#endif

namespace compiler {

bool SeccompFilter::applySyscallFilter() {
#if defined(__linux__) && defined(HAVE_SECCOMP)
    // Initialize filter: default KILL action for unauthorized syscalls
    scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL);
    if (!ctx) {
        std::cerr << "[SeccompFilter] Failed to initialize seccomp context\n";
        return false;
    }

    // Whitelist only essential syscalls for user code execution
    const int allowedSyscalls[] = {
        SCMP_SYS(read),
        SCMP_SYS(write),
        SCMP_SYS(close),
        SCMP_SYS(fstat),
        SCMP_SYS(mmap),
        SCMP_SYS(mprotect),
        SCMP_SYS(munmap),
        SCMP_SYS(brk),
        SCMP_SYS(exit_group),
        SCMP_SYS(exit),
        SCMP_SYS(futex),
        SCMP_SYS(gettimeofday),
        SCMP_SYS(clock_gettime),
        SCMP_SYS(getpid),
        SCMP_SYS(rt_sigaction),
        SCMP_SYS(rt_sigprocmask),
        SCMP_SYS(rt_sigreturn)
    };

    for (int syscall : allowedSyscalls) {
        if (seccomp_rule_add(ctx, SCMP_ACT_ALLOW, syscall, 0) < 0) {
            std::cerr << "[SeccompFilter] Failed to add rule for syscall: " << syscall << "\n";
            seccomp_release(ctx);
            return false;
        }
    }

    // Load filter into kernel
    if (seccomp_load(ctx) < 0) {
        std::cerr << "[SeccompFilter] Failed to load seccomp filter\n";
        seccomp_release(ctx);
        return false;
    }

    seccomp_release(ctx);
    return true;
#else
    // Stub for non-Linux / local development environments
    return true;
#endif
}

} // namespace compiler
