import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// 이미지 저장 디렉토리
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'briefings');

export async function POST(request: NextRequest) {
  try {
    const { imageDataUrl, date, symbol } = await request.json();

    if (!imageDataUrl || !date || !symbol) {
      return NextResponse.json(
        { error: 'imageDataUrl, date, symbol are required' },
        { status: 400 }
      );
    }

    // 디렉토리 생성 (없으면)
    if (!existsSync(IMAGES_DIR)) {
      await mkdir(IMAGES_DIR, { recursive: true });
    }

    // data URL에서 base64 데이터 추출
    const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 파일명 생성
    const filename = `briefing-${date}-${symbol}.png`;
    const filepath = path.join(IMAGES_DIR, filename);

    // 파일 저장
    await writeFile(filepath, buffer);

    // 저장된 이미지의 공개 URL
    const publicUrl = `/images/briefings/${filename}`;

    return NextResponse.json({
      success: true,
      filename,
      url: publicUrl,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Error saving briefing image:', error);
    return NextResponse.json(
      { error: 'Failed to save image' },
      { status: 500 }
    );
  }
}

// 저장된 이미지 목록 조회
export async function GET() {
  try {
    const { readdir, stat } = await import('fs/promises');

    if (!existsSync(IMAGES_DIR)) {
      return NextResponse.json({ images: [] });
    }

    const files = await readdir(IMAGES_DIR);
    const images = await Promise.all(
      files
        .filter(f => f.endsWith('.png'))
        .map(async (filename) => {
          const filepath = path.join(IMAGES_DIR, filename);
          const stats = await stat(filepath);
          return {
            filename,
            url: `/images/briefings/${filename}`,
            size: stats.size,
            createdAt: stats.birthtime,
          };
        })
    );

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error listing briefing images:', error);
    return NextResponse.json(
      { error: 'Failed to list images' },
      { status: 500 }
    );
  }
}
