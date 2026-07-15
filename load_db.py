import sqlite3
import pandas as pd

conn = sqlite3.connect("zomato_analysis.db")
funnel_df = pd.read_csv("funnel_events.csv")
orders_df = pd.read_csv("orders.csv")

funnel_df.to_sql("funnel_events", conn, if_exists="replace", index=False)
orders_df.to_sql("orders", conn, if_exists="replace", index=False)

conn.commit()
conn.close()
print("Loaded into zomato_analysis.db")
