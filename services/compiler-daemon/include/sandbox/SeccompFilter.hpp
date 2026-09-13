#pragma once

namespace compiler {

class SeccompFilter {
public:
    static bool applySyscallFilter();
};

} // namespace compiler
