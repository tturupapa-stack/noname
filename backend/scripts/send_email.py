#!/usr/bin/env python3
"""
이메일 전송 스크립트
Gmail SMTP를 사용하여 마크다운 파일을 이메일로 전송합니다.

사용법:
    python -m scripts.send_email --to recipient@email.com --file path/to/file.md

환경 변수 설정 필요:
    GMAIL_ADDRESS: 발신자 Gmail 주소
    GMAIL_APP_PASSWORD: Gmail 앱 비밀번호 (https://myaccount.google.com/apppasswords)
"""

import argparse
import os
import smtplib
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

# SMTP 설정
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


def load_env():
    """backend/.env 파일에서 환경 변수 로드"""
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip())


def read_markdown_file(file_path: str) -> tuple[str, str]:
    """마크다운 파일을 읽고 제목과 내용을 반환"""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 첫 번째 # 헤더를 제목으로 사용
    lines = content.split("\n")
    title = "개발일지"
    for line in lines:
        if line.startswith("# "):
            title = line[2:].strip()
            break

    return title, content


def markdown_to_html(content: str) -> str:
    """간단한 마크다운을 HTML로 변환"""
    import re

    html = content

    # 코드 블록 (```...```)
    html = re.sub(
        r'```(\w*)\n(.*?)```',
        r'<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto;"><code>\2</code></pre>',
        html,
        flags=re.DOTALL
    )

    # 인라인 코드 (`...`)
    html = re.sub(r'`([^`]+)`', r'<code style="background-color: #f4f4f4; padding: 2px 5px; border-radius: 3px;">\1</code>', html)

    # 헤더
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)

    # 굵은 글씨
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)

    # 테이블 처리
    lines = html.split('\n')
    in_table = False
    new_lines = []

    for line in lines:
        if '|' in line and line.strip().startswith('|'):
            if not in_table:
                new_lines.append('<table style="border-collapse: collapse; margin: 10px 0;">')
                in_table = True

            # 구분선 스킵
            if re.match(r'^\|[\s\-:|]+\|$', line.strip()):
                continue

            cells = [c.strip() for c in line.strip().split('|')[1:-1]]
            row = '<tr>' + ''.join(f'<td style="border: 1px solid #ddd; padding: 8px;">{c}</td>' for c in cells) + '</tr>'
            new_lines.append(row)
        else:
            if in_table:
                new_lines.append('</table>')
                in_table = False
            new_lines.append(line)

    if in_table:
        new_lines.append('</table>')

    html = '\n'.join(new_lines)

    # 리스트 항목
    html = re.sub(r'^- \[ \] (.+)$', r'<li>☐ \1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'^- \[x\] (.+)$', r'<li>☑ \1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'^- (.+)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'^(\d+)\. (.+)$', r'<li>\2</li>', html, flags=re.MULTILINE)

    # 줄바꿈
    html = html.replace('\n\n', '</p><p>')
    html = html.replace('\n', '<br>')

    # HTML 래핑
    html = f'''
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }}
            h1 {{ color: #333; border-bottom: 2px solid #4A90D9; padding-bottom: 10px; }}
            h2 {{ color: #444; margin-top: 30px; }}
            h3 {{ color: #555; }}
            pre {{ background-color: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }}
            code {{ font-family: 'SF Mono', Consolas, monospace; }}
            li {{ margin: 5px 0; }}
        </style>
    </head>
    <body>
        <p>{html}</p>
    </body>
    </html>
    '''

    return html


def send_email(to_email: str, subject: str, text_content: str, html_content: str):
    """이메일 전송"""
    from_email = os.environ.get("GMAIL_ADDRESS")
    app_password = os.environ.get("GMAIL_APP_PASSWORD")

    if not from_email or not app_password:
        print("❌ 환경 변수가 설정되지 않았습니다.")
        print("   backend/.env 파일에 다음을 추가하세요:")
        print("   GMAIL_ADDRESS=your-email@gmail.com")
        print("   GMAIL_APP_PASSWORD=your-app-password")
        print("\n   Gmail 앱 비밀번호 생성: https://myaccount.google.com/apppasswords")
        sys.exit(1)

    # 이메일 메시지 구성
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email

    # 텍스트 및 HTML 버전 추가
    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        print(f"📧 이메일 전송 중...")
        print(f"   발신: {from_email}")
        print(f"   수신: {to_email}")
        print(f"   제목: {subject}")

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(from_email, app_password)
            server.sendmail(from_email, to_email, msg.as_string())

        print("✅ 이메일이 성공적으로 전송되었습니다!")

    except smtplib.SMTPAuthenticationError:
        print("❌ 인증 실패: Gmail 주소 또는 앱 비밀번호를 확인하세요.")
        print("   Gmail 앱 비밀번호 생성: https://myaccount.google.com/apppasswords")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 이메일 전송 실패: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="마크다운 파일을 이메일로 전송")
    parser.add_argument("--to", required=True, help="수신자 이메일 주소")
    parser.add_argument("--file", required=True, help="전송할 마크다운 파일 경로")
    parser.add_argument("--subject", help="이메일 제목 (기본값: 파일의 첫 번째 헤더)")

    args = parser.parse_args()

    # 환경 변수 로드
    load_env()

    # 파일 읽기
    if not os.path.exists(args.file):
        print(f"❌ 파일을 찾을 수 없습니다: {args.file}")
        sys.exit(1)

    title, content = read_markdown_file(args.file)
    subject = args.subject or f"[개발일지] {title}"

    # HTML 변환
    html_content = markdown_to_html(content)

    # 이메일 전송
    send_email(args.to, subject, content, html_content)


if __name__ == "__main__":
    main()
