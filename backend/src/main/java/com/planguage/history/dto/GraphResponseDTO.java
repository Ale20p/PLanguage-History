package com.planguage.history.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Top-level DTO for the GET /api/v1/graph endpoint.
 * Contains all nodes and links for the react-force-graph-2d canvas.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GraphResponseDTO {
    private List<NodeDTO> nodes;
    private List<LinkDTO> links;
}
