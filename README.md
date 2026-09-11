# Zomato Order Funnel & Refund-Friction Analysis

A product analytics case study: funnel analysis, SQL querying, and a
retention-impact model built to identify and prioritize a fixable product
issue — plus a proposed A/B test to validate the fix.

**TL;DR:** Users with a stale saved delivery address convert at checkout
28 points lower than users with a fresh one (48.1% vs 76.1%). Once a
complaint occurs, 30-day repeat-order rate collapses from 53.3% to as low
as 3.0% for address-triggered cancellations — the single worst-performing
segment in the funnel. Proposed fix: a pre-payment address confirmation
nudge + automated refund path for this specific failure mode.

> **Note on data:** this project uses a synthetic dataset generated to
> reflect complaint proportions and patterns documented in public Zomato
> reviews (Trustpilot, PissedConsumer, ConsumerComplaints, mid-2026) — not
> real Zomato data. The method (funnel → SQL → metrics → recommendation →
> test design) is the deliverable.

## What's in this repo

| File | Purpose |
|---|---|
| `case_study.md` | Full write-up: problem, metrics, findings, recommendation, A/B test design |
| `generate_data.py` | Generates the synthetic funnel + orders dataset |
| `load_db.py` | Loads the CSVs into a SQLite database |
| `analysis.sql` | All SQL queries used in the analysis |
| `run_analysis.py` | Runs the SQL queries and prints results |
| `make_charts.py` | Builds the charts used in the case study |
| `funnel_events.csv` / `orders.csv` | Generated datasets |
| `images/chart_*.png` | Output charts, referenced by `case_study.md` |
| `slides.pptx` | 6-slide portfolio/interview deck summarizing the case study |
| `build_slides.js` | Source code that generates `slides.pptx` (Node + pptxgenjs) |
| `requirements.txt` | Python dependencies |
| `LICENSE` | MIT license |

## How to run it

```bash
pip install -r requirements.txt
python generate_data.py      # creates funnel_events.csv, orders.csv
python load_db.py            # creates zomato_analysis.db
python run_analysis.py       # runs analysis.sql queries, prints results
python make_charts.py        # creates images/chart_1.png ... chart_4.png
```

Or explore directly in SQL:

```bash
sqlite3 zomato_analysis.db < analysis.sql
```

To regenerate the slide deck (requires Node + `npm install pptxgenjs`):

```bash
npm install pptxgenjs
node build_slides.js         # creates slides.pptx
```

## Method

1. **Funnel** — App Open → Browse → Add to Cart → Reached Checkout → Order
   Placed, instrumented with a `stale_saved_address` flag to isolate one
   hypothesis about where drop-off concentrates.
2. **Post-order outcomes** — each placed order gets a complaint type (or
   none), a refund time-to-resolution, and a 30-day repeat-order outcome,
   with probabilities calibrated to real complaint-category proportions
   from public review data.
3. **SQL layer** — all metrics (funnel conversion, complaint mix, refund
   TTR, repeat rate by segment) are computed with SQL against a SQLite DB,
   not just pandas — see `analysis.sql`.
4. **Recommendation** — the fix targeting the highest-leverage node in the
   funnel: pre-payment address confirmation + automated refunds for
   address-triggered cancellations specifically.
5. **A/B test design** — see the "A/B Test Design" section in
   `case_study.md` for hypothesis, sample size, primary/guardrail metrics,
   and rollout plan.



## Push to GitHub

```bash
cd checkout-funnel-analysis
git init
git add .
git commit -m "Checkout funnel and refund-friction analysis"
git branch -M main
git remote add origin https://github.com/<your-username>/checkout-funnel-analysis.git
git push -u origin main
```

## Author

TANISHA GANGWAL — built as a portfolio project for Product Analyst roles.

