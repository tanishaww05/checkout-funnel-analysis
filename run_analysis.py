import sqlite3
import pandas as pd

conn = sqlite3.connect("zomato_analysis.db")

with open("analysis.sql") as f:
    sql_text = f.read()

# split on the numbered comment blocks
queries = [q.strip() for q in sql_text.split(";") if q.strip() and not q.strip().startswith("--")]

# Instead, just re-run named queries individually for clean output
named_queries = {
    "1_funnel_conversion": """
        SELECT
            COUNT(*) AS app_opened,
            SUM(browsed) AS browsed,
            SUM(added_to_cart) AS added_to_cart,
            SUM(reached_checkout) AS reached_checkout,
            SUM(order_placed) AS order_placed,
            ROUND(100.0 * SUM(browsed) / COUNT(*), 1) AS pct_browsed,
            ROUND(100.0 * SUM(added_to_cart) / NULLIF(SUM(browsed), 0), 1) AS pct_browse_to_cart,
            ROUND(100.0 * SUM(reached_checkout) / NULLIF(SUM(added_to_cart), 0), 1) AS pct_cart_to_checkout,
            ROUND(100.0 * SUM(order_placed) / NULLIF(SUM(reached_checkout), 0), 1) AS pct_checkout_to_order,
            ROUND(100.0 * SUM(order_placed) / COUNT(*), 1) AS pct_overall_conversion
        FROM funnel_events;
    """,
    "2_stale_address_vs_checkout": """
        SELECT
            stale_saved_address,
            COUNT(*) AS users_with_cart,
            SUM(reached_checkout) AS reached_checkout,
            ROUND(100.0 * SUM(reached_checkout) / COUNT(*), 1) AS checkout_conversion_pct
        FROM funnel_events
        WHERE added_to_cart = 1
        GROUP BY stale_saved_address;
    """,
    "3_complaint_mix": """
        SELECT
            complaint_type,
            COUNT(*) AS orders,
            ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM orders), 1) AS pct_of_all_orders
        FROM orders
        GROUP BY complaint_type
        ORDER BY orders DESC;
    """,
    "4_refund_ttr_by_type": """
        SELECT
            complaint_type,
            COUNT(*) AS refund_cases,
            ROUND(AVG(refund_ttr_hours), 1) AS avg_ttr_hours,
            ROUND(MIN(refund_ttr_hours), 1) AS min_ttr_hours,
            ROUND(MAX(refund_ttr_hours), 1) AS max_ttr_hours
        FROM orders
        WHERE refund_requested = 1
        GROUP BY complaint_type
        ORDER BY avg_ttr_hours DESC;
    """,
    "5_repeat_rate_complaint_vs_none": """
        SELECT
            CASE WHEN complaint_type = 'none' THEN 'No complaint' ELSE 'Had complaint' END AS segment,
            COUNT(*) AS orders,
            SUM(repeat_order_30d) AS repeat_orders,
            ROUND(100.0 * SUM(repeat_order_30d) / COUNT(*), 1) AS repeat_rate_pct
        FROM orders
        GROUP BY segment;
    """,
    "6_repeat_rate_by_complaint_type": """
        SELECT
            complaint_type,
            COUNT(*) AS orders,
            ROUND(AVG(refund_ttr_hours), 1) AS avg_refund_ttr_hours,
            ROUND(100.0 * SUM(repeat_order_30d) / COUNT(*), 1) AS repeat_rate_pct
        FROM orders
        GROUP BY complaint_type
        ORDER BY repeat_rate_pct ASC;
    """,
    "7_city_stale_address": """
        SELECT
            city,
            COUNT(*) AS carts,
            SUM(stale_saved_address) AS stale_address_carts,
            ROUND(100.0 * SUM(stale_saved_address) / COUNT(*), 1) AS pct_stale_address
        FROM funnel_events
        WHERE added_to_cart = 1
        GROUP BY city
        ORDER BY pct_stale_address DESC;
    """,
}

results = {}
for name, q in named_queries.items():
    df = pd.read_sql_query(q, conn)
    results[name] = df
    print(f"\n=== {name} ===")
    print(df.to_string(index=False))

conn.close()
