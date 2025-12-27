const pptxgen = require('pptxgenjs');
const path = require('path');
const html2pptx = require('./html2pptx.js');

const WORKSPACE = '/Users/larkkim/프로젝트 [리치]/while-you-were-sleeping-dashboard/output/pptx-workspace';

async function createPresentation() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Weekly Stock Briefing - 2025년 12월 4주차';
    pptx.author = 'While You Were Sleeping';
    pptx.subject = '주간 주식 브리핑';

    const slides = [
        'slide1-title.html',
        'slide2-market.html',
        'slide3-trending.html',
        'slide4-nvidia.html',
        'slide5-nike.html',
        'slide6-summary.html'
    ];

    for (const slideFile of slides) {
        const htmlPath = path.join(WORKSPACE, slideFile);
        console.log(`Processing: ${slideFile}`);
        await html2pptx(htmlPath, pptx);
    }

    const outputPath = path.join(WORKSPACE, 'weekly-briefing-2025-12-w4.pptx');
    await pptx.writeFile({ fileName: outputPath });
    console.log(`Presentation created: ${outputPath}`);
}

createPresentation().catch(err => {
    console.error('Error creating presentation:', err);
    process.exit(1);
});
