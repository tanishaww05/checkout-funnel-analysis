-- =====================================================================
-- Zomato Order Funnel & Refund-Friction Analysis
-- SQL queries (SQLite dialect, portable to MySQL/Postgres with minor edits)
-- =====================================================================

-- -----------------------------------------------------------------
-- 1. FUNNEL CONVERSION: App Open -> Browse -> Cart -> Checkout -> Order
-- -----------------------------------------------------------------
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

-- -----------------------------------------------------------------
-- 2. THE KEY INSIGHT: stale saved address vs checkout drop-off
-- This isolates the specific leak worth fixing.
-- -----------------------------------------------------------------
SELECT
    stale_saved_address,
    COUNT(*) AS users_with_cart,
    SUM(reached_checkout) AS reached_checkout,
    ROUND(100.0 * SUM(reached_checkout) / COUNT(*), 1) AS checkout_conversion_pct
FROM funnel_events
WHERE added_to_cart = 1
GROUP BY stale_saved_address;

-- -----------------------------------------------------------------
-- 3. COMPLAINT MIX (post-order): what's actually breaking after checkout
-- -----------------------------------------------------------------
SELECT
    complaint_type,
    COUNT(*) AS orders,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM orders), 1) AS pct_of_all_orders
FROM orders
GROUP BY complaint_type
ORDER BY orders DESC;

-- -----------------------------------------------------------------
-- 4. REFUND TIME-TO-RESOLUTION (TTR) BY COMPLAINT TYPE
-- (Customer Effort proxy — the longer this is, the more it shows up as
--  1-star reviews mentioning "passed around support")
-- -----------------------------------------------------------------
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

-- -----------------------------------------------------------------
-- 5. NORTH-STAR IMPACT: 30-day repeat order rate, with vs without complaint
-- This is the money query — ties support/product friction directly to
-- retention, which is what a Product Analyst needs to prove.
-- -----------------------------------------------------------------
SELECT
    CASE WHEN complaint_type = 'none' THEN 'No complaint' ELSE 'Had complaint' END AS segment,
    COUNT(*) AS orders,
    SUM(repeat_order_30d) AS repeat_orders,
    ROUND(100.0 * SUM(repeat_order_30d) / COUNT(*), 1) AS repeat_rate_pct
FROM orders
GROUP BY segment;

-- -----------------------------------------------------------------
-- 6. REPEAT RATE BROKEN DOWN BY SPECIFIC COMPLAINT TYPE
-- Shows which failure mode is most retention-destructive
-- -----------------------------------------------------------------
SELECT
    complaint_type,
    COUNT(*) AS orders,
    ROUND(AVG(refund_ttr_hours), 1) AS avg_refund_ttr_hours,
    ROUND(100.0 * SUM(repeat_order_30d) / COUNT(*), 1) AS repeat_rate_pct
FROM orders
GROUP BY complaint_type
ORDER BY repeat_rate_pct ASC;

-- -----------------------------------------------------------------
-- 7. REVENUE AT RISK: estimated monthly order value lost to the single
-- largest fixable leak (address-triggered cancellations)
-- -----------------------------------------------------------------
SELECT
    complaint_type,
    COUNT(*) AS affected_orders,
    ROUND(AVG(order_value_inr), 1) AS avg_order_value_inr,
    ROUND(SUM(order_value_inr), 1) AS total_order_value_inr,
    ROUND((1 - (SELECT 100.0 * SUM(repeat_order_30d)/COUNT(*) FROM orders WHERE complaint_type='address_triggered_cancellation')/
        (SELECT 100.0 * SUM(repeat_order_30d)/COUNT(*) FROM orders WHERE complaint_type='none')) * 100, 1
    ) AS pct_repeat_rate_gap_vs_baseline
FROM orders
WHERE complaint_type = 'address_triggered_cancellation';

-- -----------------------------------------------------------------
-- 8. CITY-LEVEL VIEW: where is the stale-address problem concentrated?
-- -----------------------------------------------------------------
SELECT
    city,
    COUNT(*) AS carts,
    SUM(stale_saved_address) AS stale_address_carts,
    ROUND(100.0 * SUM(stale_saved_address) / COUNT(*), 1) AS pct_stale_address
FROM funnel_events
WHERE added_to_cart = 1
GROUP BY city
ORDER BY pct_stale_address DESC;
