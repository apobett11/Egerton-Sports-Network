---
name: figma-mcp
description: Figma MCP tool integration skill for inspecting Figma design files, extracting component tokens, styles, assets, and converting Figma designs directly into pixel-perfect React components.
---

# Figma MCP Tool & Integration Skill

This skill allows Antigravity to interface with Figma designs using Model Context Protocol (MCP) or Figma APIs to extract design systems, design tokens, component specifications, and frame layouts.

## Capabilities & Usage

### 1. Design Token Extraction
- Extract colors, typography scales, border radii, shadows, and spacing variables from Figma files.
- Automatically map Figma styles to Tailwind CSS or CSS variables.

### 2. Component Generation
- Read Figma frames and generate semantic React TypeScript components.
- Map Figma autolayout properties (`flex-direction`, `gap`, `padding`, `alignment`) directly to flex and grid utility classes.

### 3. Asset & Icon Pipeline
- Download or reference vector icons (Lucide React icons or SVG exports) matching Figma node exports.
