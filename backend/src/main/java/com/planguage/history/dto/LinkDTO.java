package com.planguage.history.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a single directed edge in the force-directed graph.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LinkDTO {
    private String source;  // Source language ID
    private String target;  // Target language ID
    private String type;    // Connection type (e.g., "INFLUENCED_BY")
}
