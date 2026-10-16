"""Python 3.12; pip install plotly==6.3.1. All data is synthetic."""
import csv
from pathlib import Path
import plotly
import plotly.graph_objects as go
from plotly.subplots import make_subplots

HERE = Path(__file__).resolve().parent
with (HERE / "traffic.csv").open(encoding="utf-8", newline="") as source:
    rows = list(csv.DictReader(source))
days = [row["day"] for row in rows]
requests = [int(row["requests"]) for row in rows]
failures = [int(row["failures"]) for row in rows]
assert all(0 <= bad <= total for bad, total in zip(failures, requests))
rates = [bad / total * 100 if total else None for bad, total in zip(failures, requests)]
assert days[failures.index(max(failures))] == "2026-10-03"
assert days[rates.index(max(value for value in rates if value is not None))] == "2026-10-04"
fig = make_subplots(rows=2, cols=1, shared_xaxes=True, subplot_titles=("실패 건수", "실패율 (%)"), vertical_spacing=0.17)
custom = [[total, bad, rate] for total, bad, rate in zip(requests, failures, rates)]
hover = "%{x}<br>요청 %{customdata[0]}건<br>실패 %{customdata[1]}건<br>실패율 %{customdata[2]:.2f}%<extra></extra>"
fig.add_trace(go.Bar(x=days, y=failures, customdata=custom, hovertemplate=hover, marker_color="#477161", name="실패 건수"), row=1, col=1)
fig.add_trace(go.Scatter(x=days, y=rates, customdata=custom, hovertemplate=hover, line_color="#b24f2c", mode="lines+markers", name="실패율"), row=2, col=1)
fig.update_layout(height=650, template="plotly_white", showlegend=False, margin=dict(t=50, l=55, r=25, b=50))
chart = fig.to_html(full_html=False, include_plotlyjs=True, div_id="traffic-chart", config={"displaylogo": False, "responsive": True})
html = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="합성 데이터 7일의 실패 건수와 비율을 비교하는 Plotly 실습"><title>실패 건수와 비율</title><style>body{font-family:system-ui;margin:24px auto;max-width:1000px;padding:0 16px}h1{font-size:24px}p{line-height:1.7}</style></head><body><h1>실패 건수와 비율</h1><p>실패 20건인 날은 2%, 실패 8건인 날은 10%입니다. 모든 데이터는 설명용 합성 데이터입니다.</p>' + chart + '</body></html>'
(HERE / "traffic.html").write_text(html, encoding="utf-8")
print("Plotly", plotly.__version__, ": count maximum 2026-10-03; rate maximum 2026-10-04. HTML exported.")
