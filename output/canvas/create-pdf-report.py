import json
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime

# Load briefings data
with open('../backend/data/briefings.json', 'r') as f:
    data = json.load(f)

# Create PDF
pdf_path = 'hot-stocks-weekly-report.pdf'
doc = SimpleDocTemplate(pdf_path, pagesize=A4, topMargin=30*mm, bottomMargin=20*mm, leftMargin=20*mm, rightMargin=20*mm)

# Styles
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Title_Custom', fontSize=28, alignment=TA_CENTER, spaceAfter=20, textColor=colors.HexColor('#1a1a2e'), fontName='Helvetica-Bold'))
styles.add(ParagraphStyle(name='Subtitle', fontSize=14, alignment=TA_CENTER, spaceAfter=30, textColor=colors.HexColor('#666666')))
styles.add(ParagraphStyle(name='Section', fontSize=16, alignment=TA_LEFT, spaceBefore=20, spaceAfter=10, textColor=colors.HexColor('#1a1a2e'), fontName='Helvetica-Bold'))
styles.add(ParagraphStyle(name='Body_Custom', fontSize=10, alignment=TA_LEFT, spaceAfter=10, textColor=colors.HexColor('#333333')))

story = []

# ========== Page 1: Cover ==========
story.append(Spacer(1, 80))
story.append(Paragraph("Hot Stocks Weekly Report", styles['Title_Custom']))
story.append(Paragraph("화제종목 주간 분석 리포트", styles['Subtitle']))
story.append(Spacer(1, 20))
story.append(Paragraph(f"Report Date: {datetime.now().strftime('%Y-%m-%d')}", styles['Subtitle']))
story.append(Paragraph("While You Were Sleeping Dashboard", styles['Subtitle']))
story.append(Spacer(1, 40))

# Summary stats
total_stocks = len(data)
unique_symbols = len(set(item['stock']['symbol'] for item in data))
avg_change = sum(item['stock']['change_percent'] for item in data) / len(data)
avg_score = sum(item['score']['total'] for item in data) / len(data)

summary_data = [
    ['Metric', 'Value'],
    ['Analysis Period', f"{data[-1]['date']} ~ {data[0]['date']}"],
    ['Total Records', str(total_stocks)],
    ['Unique Stocks', str(unique_symbols)],
    ['Avg Change', f"{avg_change:.2f}%"],
    ['Avg Score', f"{avg_score:.1f}/40"],
]

summary_table = Table(summary_data, colWidths=[120, 150])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 11),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f5f5f5')),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cccccc')),
    ('ROWHEIGHT', (0, 0), (-1, -1), 25),
]))
story.append(summary_table)

story.append(PageBreak())

# ========== Page 2: Comparison Image ==========
story.append(Paragraph("Hot Stocks Comparison", styles['Section']))
story.append(Paragraph("일별 화제종목 비교 차트", styles['Body_Custom']))
story.append(Spacer(1, 10))

# Add the comparison image
img_path = 'hot-stocks-comparison.png'
img = Image(img_path, width=170*mm, height=113*mm)
story.append(img)

story.append(PageBreak())

# ========== Page 3: Daily Hot Stocks Table ==========
story.append(Paragraph("Daily Hot Stocks", styles['Section']))
story.append(Paragraph("일별 화제종목 상세 데이터", styles['Body_Custom']))
story.append(Spacer(1, 10))

# Table data
table_data = [['Date', 'Symbol', 'Company', 'Price', 'Change', 'Vol Ratio', 'Score']]
for item in data:
    stock = item['stock']
    change_str = f"+{stock['change_percent']:.1f}%" if stock['change_percent'] > 0 else f"{stock['change_percent']:.1f}%"
    table_data.append([
        item['date'],
        stock['symbol'],
        stock['name'][:20] + '...' if len(stock['name']) > 20 else stock['name'],
        f"${stock['price']:.2f}",
        change_str,
        f"{stock['volume_ratio']:.2f}x",
        str(item['score']['total'])
    ])

main_table = Table(table_data, colWidths=[55, 45, 95, 50, 50, 50, 40])
main_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
    ('TOPPADDING', (0, 0), (-1, 0), 10),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
    ('ROWHEIGHT', (0, 0), (-1, -1), 22),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))

# Color positive/negative changes
for i, item in enumerate(data, 1):
    if item['stock']['change_percent'] > 0:
        main_table.setStyle(TableStyle([('TEXTCOLOR', (4, i), (4, i), colors.HexColor('#00AA00'))]))
    else:
        main_table.setStyle(TableStyle([('TEXTCOLOR', (4, i), (4, i), colors.HexColor('#DD0000'))]))

story.append(main_table)

story.append(PageBreak())

# ========== Page 4: Score Analysis ==========
story.append(Paragraph("Score Analysis", styles['Section']))
story.append(Paragraph("화제종목 점수 분석 (각 항목 최대 10점, 총점 40점)", styles['Body_Custom']))
story.append(Spacer(1, 10))

score_data = [['Date', 'Symbol', 'Volume', 'Price Change', 'Momentum', 'Market Cap', 'Total']]
for item in data:
    score = item['score']
    score_data.append([
        item['date'],
        item['stock']['symbol'],
        str(score['volume_score']),
        str(score['price_change_score']),
        str(score['momentum_score']),
        str(score['market_cap_score']),
        str(score['total'])
    ])

# Add average row
avg_vol = sum(item['score']['volume_score'] for item in data) / len(data)
avg_price = sum(item['score']['price_change_score'] for item in data) / len(data)
avg_mom = sum(item['score']['momentum_score'] for item in data) / len(data)
avg_mcap = sum(item['score']['market_cap_score'] for item in data) / len(data)
score_data.append(['Average', '-', f'{avg_vol:.1f}', f'{avg_price:.1f}', f'{avg_mom:.1f}', f'{avg_mcap:.1f}', f'{avg_score:.1f}'])

score_table = Table(score_data, colWidths=[55, 45, 55, 70, 60, 70, 45])
score_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
    ('TOPPADDING', (0, 0), (-1, 0), 10),
    ('BACKGROUND', (0, 1), (-1, -2), colors.white),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8e8e8')),
    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
    ('ROWHEIGHT', (0, 0), (-1, -1), 22),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(score_table)

story.append(Spacer(1, 30))

# ========== Stock Summary ==========
story.append(Paragraph("Stock Summary", styles['Section']))
story.append(Paragraph("종목별 요약 통계", styles['Body_Custom']))
story.append(Spacer(1, 10))

from collections import defaultdict
stock_stats = defaultdict(list)
for item in data:
    stock_stats[item['stock']['symbol']].append(item)

summary_data2 = [['Symbol', 'Company', 'Appearances', 'Avg Price', 'Avg Change', 'Max Vol Ratio', 'Avg Score']]
for symbol, items in stock_stats.items():
    avg_p = sum(i['stock']['price'] for i in items) / len(items)
    avg_c = sum(i['stock']['change_percent'] for i in items) / len(items)
    max_v = max(i['stock']['volume_ratio'] for i in items)
    avg_s = sum(i['score']['total'] for i in items) / len(items)
    summary_data2.append([
        symbol,
        items[0]['stock']['name'][:18] + '..' if len(items[0]['stock']['name']) > 18 else items[0]['stock']['name'],
        str(len(items)),
        f"${avg_p:.2f}",
        f"{avg_c:+.1f}%",
        f"{max_v:.1f}x",
        f"{avg_s:.1f}"
    ])

summary_table2 = Table(summary_data2, colWidths=[45, 90, 60, 55, 60, 60, 50])
summary_table2.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
    ('TOPPADDING', (0, 0), (-1, 0), 10),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
    ('ROWHEIGHT', (0, 0), (-1, -1), 22),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(summary_table2)

story.append(PageBreak())

# ========== Page 5: Why Hot Analysis ==========
story.append(Paragraph("Why Hot Analysis", styles['Section']))
story.append(Paragraph("화제 선정 사유 분석", styles['Body_Custom']))
story.append(Spacer(1, 10))

for item in data:
    story.append(Paragraph(f"<b>{item['date']} - {item['stock']['symbol']}</b> ({item['stock']['name'][:25]})", styles['Body_Custom']))
    reasons = item.get('why_hot', [])
    for reason in reasons:
        story.append(Paragraph(f"  • {reason['message']}", styles['Body_Custom']))
    story.append(Spacer(1, 10))

# Footer
story.append(Spacer(1, 30))
story.append(Paragraph("Generated by While You Were Sleeping Dashboard", ParagraphStyle(name='Footer', fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor('#999999'))))

# Build PDF
doc.build(story)
print(f"PDF report saved: {pdf_path}")
