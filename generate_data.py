"""
generate_data.py
Generates a synthetic dataset that mirrors real, publicly-documented Zomato
user pain points (refund delays, wrong-address cancellations, missing/wrong
items, false 'delivered' status) so we can build a funnel + product-metrics
analysis on top of it.

This is SYNTHETIC data, built to reflect proportions seen in public review
sources (Trustpilot, PissedConsumer, ConsumerComplaints) as of mid-2026 —
NOT scraped or real user data.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

N_USERS = 4000
DAYS = 60
START = datetime(2026, 5, 1)

cities = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Pune", "Kolkata"]

# ---------------------------------------------------------------
# 1. FUNNEL: App Open -> Browse -> Add to Cart -> Checkout -> Order Placed
# Drop-off rates roughly reflect typical food-delivery funnels, with an
# extra leak at Checkout caused by "stale saved address" friction.
# ---------------------------------------------------------------
funnel_rows = []
for uid in range(1, N_USERS + 1):
    city = np.random.choice(cities)
    day_offset = np.random.randint(0, DAYS)
    session_date = START + timedelta(days=day_offset)

    opened = True
    browsed = np.random.rand() < 0.88
    cart = browsed and (np.random.rand() < 0.62)

    # Stale/old saved address flag - drives extra checkout drop-off
    stale_address = np.random.rand() < 0.22
    checkout_base_rate = 0.75
    checkout_rate = checkout_base_rate - (0.28 if stale_address else 0)
    checkout = cart and (np.random.rand() < checkout_rate)

    order_placed = checkout and (np.random.rand() < 0.93)

    funnel_rows.append({
        "user_id": uid,
        "city": city,
        "session_date": session_date.date().isoformat(),
        "stale_saved_address": stale_address,
        "app_opened": opened,
        "browsed": browsed,
        "added_to_cart": cart,
        "reached_checkout": checkout,
        "order_placed": order_placed,
    })

funnel_df = pd.DataFrame(funnel_rows)

# ---------------------------------------------------------------
# 2. ORDERS: for every order_placed=True row, simulate delivery outcome,
# complaint type (or none), refund handling, and whether user repeat-orders
# within 30 days.
# Complaint category proportions approximate what shows up repeatedly in
# public review data: missing/wrong item, address-triggered cancellation,
# false "delivered" status, refund delay, no complaint.
# ---------------------------------------------------------------
complaint_types = [
    "none",
    "missing_or_wrong_item",
    "address_triggered_cancellation",
    "false_delivered_status",
    "refund_delay_only",
]
complaint_probs = [0.58, 0.16, 0.12, 0.06, 0.08]

order_rows = []
orders = funnel_df[funnel_df.order_placed].copy()

for _, r in orders.iterrows():
    # stale address strongly increases address-triggered cancellation odds
    probs = complaint_probs.copy()
    if r.stale_saved_address:
        probs = [0.40, 0.16, 0.30, 0.06, 0.08]
    probs = np.array(probs) / np.sum(probs)

    complaint = np.random.choice(complaint_types, p=probs)
    order_value = round(np.random.gamma(shape=3.0, scale=120), 2)  # INR

    if complaint == "none":
        refund_requested = False
        refund_ttr_hours = np.nan
        delivered_ok = True
    else:
        refund_requested = complaint != "none"
        # refund time-to-resolution varies a lot by complaint type
        if complaint == "address_triggered_cancellation":
            refund_ttr_hours = round(np.random.gamma(shape=4, scale=9), 1)  # slow
        elif complaint == "false_delivered_status":
            refund_ttr_hours = round(np.random.gamma(shape=5, scale=11), 1)  # slowest
        elif complaint == "refund_delay_only":
            refund_ttr_hours = round(np.random.gamma(shape=3, scale=7), 1)
        else:
            refund_ttr_hours = round(np.random.gamma(shape=2, scale=5), 1)
        delivered_ok = complaint in ("refund_delay_only",)

    # Repeat order within 30 days: strongly penalized by unresolved/slow complaints
    base_repeat = 0.55
    if complaint == "none":
        repeat_prob = base_repeat
    else:
        penalty = min(0.05 * (refund_ttr_hours or 0), 0.40)
        repeat_prob = max(base_repeat - 0.15 - penalty, 0.05)
    repeat_order_30d = np.random.rand() < repeat_prob

    order_rows.append({
        "user_id": r.user_id,
        "city": r.city,
        "order_date": r.session_date,
        "order_value_inr": order_value,
        "complaint_type": complaint,
        "refund_requested": bool(refund_requested),
        "refund_ttr_hours": refund_ttr_hours,
        "delivered_ok": delivered_ok,
        "repeat_order_30d": bool(repeat_order_30d),
    })

orders_df = pd.DataFrame(order_rows)

funnel_df.to_csv("funnel_events.csv", index=False)
orders_df.to_csv("orders.csv", index=False)

print("funnel_events.csv:", funnel_df.shape)
print("orders.csv:", orders_df.shape)
print(orders_df.complaint_type.value_counts(normalize=True).round(3))
