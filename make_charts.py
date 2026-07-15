import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import sqlite3
import pandas as pd

conn = sqlite3.connect("zomato_analysis.db")

COLOR_MAIN = "#E23744"   # zomato-red-ish
COLOR_GREY = "#4A4A4A"
COLOR_ACCENT = "#2E7D32"
plt.rcParams["font.family"] = "DejaVu Sans"

# ---------------------------------------------------------
# Chart 1: Funnel
# ---------------------------------------------------------
funnel = pd.read_sql_query("""
    SELECT
        COUNT(*) AS app_opened,
        SUM(browsed) AS browsed,
        SUM(added_to_cart) AS added_to_cart,
        SUM(reached_checkout) AS reached_checkout,
        SUM(order_placed) AS order_placed
    FROM funnel_events
""", conn).iloc[0]

stages = ["App Open", "Browsed", "Added to\nCart", "Reached\nCheckout", "Order\nPlaced"]
values = [funnel.app_opened, funnel.browsed, funnel.added_to_cart, funnel.reached_checkout, funnel.order_placed]

fig, ax = plt.subplots(figsize=(8, 5))
bars = ax.bar(stages, values, color=COLOR_MAIN, width=0.55)
for i, (bar, v) in enumerate(zip(bars, values)):
    ax.text(bar.get_x() + bar.get_width()/2, v + 60, f"{v:,}", ha="center", fontsize=10, fontweight="bold")
    if i > 0:
        drop_pct = 100 * (values[i-1] - v) / values[i-1]
        ax.text(bar.get_x() + bar.get_width()/2, v/2, f"-{drop_pct:.0f}%", ha="center",
                 color="white", fontsize=9, fontweight="bold")
ax.set_title("Order Funnel: App Open → Order Placed  (n=4,000 sessions)", fontsize=13, fontweight="bold")
ax.set_ylabel("Users")
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("chart_1_funnel.png", dpi=150)
plt.close()

# ---------------------------------------------------------
# Chart 2: Checkout conversion, stale address vs fresh address
# ---------------------------------------------------------
stale = pd.read_sql_query("""
    SELECT stale_saved_address,
           ROUND(100.0*SUM(reached_checkout)/COUNT(*),1) AS checkout_conv
    FROM funnel_events WHERE added_to_cart=1
    GROUP BY stale_saved_address
""", conn)
labels = ["Fresh saved\naddress", "Stale saved\naddress (30+ days)"]
vals = stale.sort_values("stale_saved_address")["checkout_conv"].tolist()

fig, ax = plt.subplots(figsize=(6, 5))
bars = ax.bar(labels, vals, color=[COLOR_ACCENT, COLOR_MAIN], width=0.5)
for bar, v in zip(bars, vals):
    ax.text(bar.get_x()+bar.get_width()/2, v+1, f"{v}%", ha="center", fontsize=12, fontweight="bold")
ax.set_ylim(0, 100)
ax.set_ylabel("Cart → Checkout conversion (%)")
ax.set_title("The Leak: Stale Saved Address Nearly Halves\nCheckout Conversion", fontsize=12, fontweight="bold")
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("chart_2_stale_address_leak.png", dpi=150)
plt.close()

# ---------------------------------------------------------
# Chart 3: Complaint mix (post-order)
# ---------------------------------------------------------
mix = pd.read_sql_query("""
    SELECT complaint_type, COUNT(*) as n
    FROM orders GROUP BY complaint_type ORDER BY n DESC
""", conn)
name_map = {
    "none": "No complaint",
    "missing_or_wrong_item": "Missing / wrong item",
    "address_triggered_cancellation": "Address-triggered\ncancellation",
    "refund_delay_only": "Refund delay",
    "false_delivered_status": "False 'delivered'\nstatus",
}
mix["label"] = mix.complaint_type.map(name_map)
colors = [COLOR_ACCENT if c == "none" else COLOR_MAIN for c in mix.complaint_type]

fig, ax = plt.subplots(figsize=(8, 5))
bars = ax.barh(mix.label, mix.n, color=colors)
for bar, v in zip(bars, mix.n):
    ax.text(v + 8, bar.get_y() + bar.get_height()/2, f"{v}", va="center", fontsize=10, fontweight="bold")
ax.invert_yaxis()
ax.set_xlabel("Orders")
ax.set_title("Post-Order Complaint Mix (n=1,447 orders)", fontsize=13, fontweight="bold")
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("chart_3_complaint_mix.png", dpi=150)
plt.close()

# ---------------------------------------------------------
# Chart 4: 30-day repeat rate by complaint type (the money chart)
# ---------------------------------------------------------
repeat = pd.read_sql_query("""
    SELECT complaint_type,
           ROUND(100.0*SUM(repeat_order_30d)/COUNT(*),1) as repeat_rate
    FROM orders GROUP BY complaint_type ORDER BY repeat_rate ASC
""", conn)
repeat["label"] = repeat.complaint_type.map(name_map)
colors2 = [COLOR_ACCENT if c == "none" else COLOR_MAIN for c in repeat.complaint_type]

fig, ax = plt.subplots(figsize=(8, 5))
bars = ax.barh(repeat.label, repeat.repeat_rate, color=colors2)
for bar, v in zip(bars, repeat.repeat_rate):
    ax.text(v + 1, bar.get_y() + bar.get_height()/2, f"{v}%", va="center", fontsize=10, fontweight="bold")
ax.set_xlabel("30-day repeat order rate (%)")
ax.set_title("Retention Impact: Repeat-Order Rate Collapses\nWhen a Complaint Occurs", fontsize=13, fontweight="bold")
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("chart_4_retention_impact.png", dpi=150)
plt.close()

conn.close()
print("Charts saved.")
