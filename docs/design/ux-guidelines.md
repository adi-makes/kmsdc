# UX guidelines

**Status:** Baseline rules (Phase 0). Expanded in Phase 2.

1. **Accessibility target:** WCAG 2.2 AA. Keyboard operable, visible focus ring, 4.5:1 text contrast, 44×44 px touch targets, labels on every input, no placeholder-only labels.
2. **Status is never colour alone.** Pair colour with text and/or an icon.
3. **Errors appear next to the field**, in plain language, with an error summary for long forms.
4. **Every async view has loading, empty and error states.** Empty states explain what to do next.
5. **Destructive or irreversible actions** (finalise note, issue invoice, refund, merge) need explicit confirmation that names the consequence.
6. **Mock integrations are always visibly labelled** ("Mock mode: not actually sent").
7. **Never show invented data.** Missing clinic details render as clearly labelled placeholders (staff) or are hidden (public).
8. **Time is always shown in clinic time (IST)** with an explicit date. Relative time is used only as a supplement.
9. **Respect `prefers-reduced-motion`.** Motion explains change and is never decorative-only.
10. **Mobile:** no horizontal scrolling on public pages. Staff tables collapse to cards or scroll inside a container with a sticky first column.
11. **Clinical safety cues:** allergies and medical alerts appear in the patient header on every clinical screen.
