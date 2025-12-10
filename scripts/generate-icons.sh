#!/bin/bash

# PWA 아이콘 생성 스크립트
# ImageMagick이 설치되어 있어야 합니다: brew install imagemagick

echo "PWA 아이콘 생성 중..."

# SVG 파일 경로
SVG_FILE="public/icon.svg"

# 아이콘 크기 배열
declare -a SIZES=(192 512 180)
declare -a NAMES=("icon-192" "icon-512" "icon-180")

# 각 크기별로 PNG 생성
for i in "${!SIZES[@]}"; do
  SIZE=${SIZES[$i]}
  NAME=${NAMES[$i]}
  
  if command -v convert &> /dev/null; then
    echo "생성 중: ${NAME}.png (${SIZE}x${SIZE})"
    convert "$SVG_FILE" -resize "${SIZE}x${SIZE}" -background transparent "public/${NAME}.png"
  else
    echo "ImageMagick이 설치되어 있지 않습니다."
    echo "설치: brew install imagemagick"
    exit 1
  fi
done

# Maskable icon 생성 (안전 영역 포함)
if command -v convert &> /dev/null; then
  echo "생성 중: icon-maskable.png (512x512, maskable)"
  convert "$SVG_FILE" -resize 512x512 -background transparent -gravity center -extent 512x512 "public/icon-maskable.png"
fi

echo "완료! 생성된 아이콘:"
ls -lh public/icon-*.png

