# Claude Code skills and tooling evaluation

**Inspected:** 2026-11-12, user-level skills in `~/.claude/skills/`. No MCP servers are configured.
Nothing new was installed during Phase 0.

| Skill                            | Source / author                                 | What it contains                                                                                                          | Network / scripts                                          | Verdict                                                                                                  |
| -------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `ui-ux-pro-max`                  | Local data set (MIT-style; no author field)     | Searchable CSV data: styles, palettes, font pairings, 120 UX guidelines, stack notes; Python search scripts (stdlib only) | Search scripts run offline; only test files reference URLs | **Use** in Phase 2 (design direction, palette/typography candidates, UX checklist) and in QA passes      |
| `web-design-guidelines`          | Vercel (`vercel-labs/web-interface-guidelines`) | Review procedure that fetches the latest guideline file from GitHub raw                                                   | Fetches one markdown file (read-only)                      | **Use** for UI reviews from Phase 2 onward                                                               |
| `design-system`                  | claudekit (MIT)                                 | Three-layer token architecture guidance, token generator/validator scripts (Node)                                         | `fetch-background.py` fetches images; not needed           | **Use the guidance** for token structure. Do not run image-fetch scripts                                 |
| `ui-styling`                     | claudekit (MIT)                                 | shadcn/ui + Tailwind guidance, `shadcn_add.py` helper                                                                     | Has `requirements.txt`                                     | **Use the reference docs.** Run the shadcn CLI directly rather than the wrapper                          |
| `brand`                          | claudekit                                       | Brand voice and identity guidance                                                                                         | —                                                          | **Optional.** Useful once the clinic's brand assets arrive                                               |
| `design` / `banner-design`       | claudekit                                       | Logo/CIP/banner generation, partly via external AI image APIs (Gemini etc.)                                               | External paid APIs possible                                | **Do not use for logos** (the clinic has existing branding). Banners maybe in Phase 10, mock/manual only |
| `slides`                         | claudekit                                       | HTML presentations                                                                                                        | —                                                          | Not needed                                                                                               |
| `find-skills`                    | —                                               | Skill discovery/installer                                                                                                 | Installs third-party skills                                | Use only with owner approval, after inspecting the source                                                |
| `frontend-design` (spec mention) | Anthropic plugin marketplace                    | —                                                                                                                         | —                                                          | **Not installed.** Can be added later if the owner wants; ui-ux-pro-max covers the need                  |

## Testing and documentation tooling

- **Playwright:** not installed globally. It will be added as a dev dependency (`@playwright/test`)
  in Phase 2/3 for screenshots at 3 breakpoints and E2E tests. Browsers download through
  `pnpm exec playwright install chromium`.
- **Context7 MCP (current docs):** not configured. Optional. It would need `claude mcp add` by the
  owner. Until then, official docs are checked directly when versions or config matter.
- **Figma:** not available and not needed (no Figma files supplied).
