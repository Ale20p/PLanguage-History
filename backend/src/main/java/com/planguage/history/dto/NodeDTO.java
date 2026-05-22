package com.planguage.history.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a single node in the force-directed graph.
 * Optimized for react-force-graph-2d consumption.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NodeDTO {
    private String id;
    private String name;
    private String group;   // Primary paradigm used for color-coding
    private int year;       // Release year extracted from releaseDate
}
