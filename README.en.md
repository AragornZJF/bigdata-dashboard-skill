# BigData Dashboard Skill

Turn Excel / JSON data into a stunning, self-contained **single-file HTML dashboard**. No CDN dependency — CSS, JS and images are all inlined, so the output opens with a double-click, perfect for offline sharing and presentation screens. Powered by ECharts + Python.

> Repository: https://github.com/AragornZJF/bigdata-dashboard-skill

---

## Installation

Just tell Claude Code or Codex:

> Please install the skill at https://github.com/AragornZJF/bigdata-dashboard-skill

The agent clones the repo into your local skills directory and registers it automatically. Then simply ask: *"generate a data dashboard for me"*.

> Requirements: Windows + Python (`py` launcher), no third-party packages. Direct CLI usage is covered in `SKILL.md`.

---

## Quick Start · Smart City Dashboard

Tell Claude Code:

> Build a smart-city visualization dashboard

It renders with mock data first; once you like the style, provide your real data (Excel / JSON) and the same template is rebuilt.

Or build directly from the CLI with the bundled sample data:

```bash
mkdir -p output   # first time only
py scripts/build_dashboard.py assets/templates/data/smart_city/example.json --template smart_city --output output/smart_city_dashboard.html
start output/smart_city_dashboard.html
```

---

## What This Skill Does

- **Data visualization**: converts tabular data into 9 ECharts-driven components — stat cards, bar / line / area / pie / rose / scatter charts, horizontal rankings, tables and gauge rings
- **Industry templates**: 15 pre-adapted skeletons out of the box (pharma, smart city, power plant, weather, device monitoring, revenue, credit risk, telecom store, data center, esports, generic, new consumption, smart dashboard, new energy vehicle, property management)
- **Dual input**: feed `.xlsx` or `.json` directly to the build script; Excel structures are auto-detected
- **Fully self-contained**: single-file HTML output, typically 1–8 MB, easy to share via email or USB stick
- **Extensible**: drop a `metadata.json` into `assets/templates/custom/` to define your own template

## Full Template Menu

All 15 templates ship with their source assets and a complete `injector.js` data-injection layer. The authoritative menu (Chinese names, skeleton names, use cases, scenario-to-template suggestions) lives in **`references/templates_menu.md`**.

## Further Reading

- **`SKILL.md`** — the authoritative specification (build pipeline, data contracts, template extension system)
- **`CLAUDE.md`** — engineering guide (architecture, dual-directory model, gotchas)
- **`assets/templates/data/<skeleton>/README.md`** — per-template field mapping
- **`references/data_schema.md`** / **`references/layout_schema.md`** — data format and layout schema

## License

Released under the [GNU AGPL-3.0 License](LICENSE).
