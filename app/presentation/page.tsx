'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function PresentationPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const router = useRouter();

    const slides = [
        {
            id: 'cover',
            content: (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="w-32 h-32 rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-2xl flex items-center justify-center mb-8"
                    >
                        <span className="text-6xl">🌙</span>
                    </motion.div>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-display font-bold tracking-tighter text-5xl md:text-8xl"
                    >
                        당신이 잠든 사이
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-h3 text-gray-500 font-light"
                    >
                        아침을 여는 금융 브리핑 대시보드
                    </motion.p>
                </div>
            ),
        },
        {
            id: 'intro',
            title: '서비스 소개',
            content: (
                <div className="flex flex-col justify-center h-full max-w-4xl mx-auto space-y-12">
                    <h2 className="text-display-sm">매일 아침 7시,<br />당신의 금융 비서</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="card-editorial p-8">
                            <h3 className="text-h3 mb-4">☀️ 모닝 브리핑</h3>
                            <p className="text-body-lg text-gray-600">밤새 일어난 중요한 금융 뉴스와 시장 동향을<br />한눈에 파악할 수 았습니다.</p>
                        </div>
                        <div className="card-editorial p-8">
                            <h3 className="text-h3 mb-4">⚡️ 간편한 사용</h3>
                            <p className="text-body-lg text-gray-600">복잡한 검색 없이,<br />핵심 정보만 정제하여 제공합니다.</p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'design',
            title: '디자인 시스템',
            content: (
                <div className="flex flex-col justify-center h-full max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-display-sm">BOLD &<br />MINIMAL</h2>
                            <p className="text-h3 font-light text-gray-500">무신사 스타일의 절제된 미학</p>
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-black rounded-none"></div>
                                <div className="w-16 h-16 bg-white border-2 border-black rounded-none"></div>
                                <div className="w-16 h-16 bg-red-600 rounded-none"></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="card-editorial p-6 bg-white">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-caption">FEATURED</span>
                                    <span className="badge-new">NEW</span>
                                </div>
                                <h3 className="text-h2 mb-2">에디토리얼 레이아웃</h3>
                                <p className="text-body text-gray-600">높은 대비, 강렬한 타이포그래피,<br />그리드 기반의 구조로 가독성을 극대화합니다.</p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'feature-1',
            title: '핵심 기능 1',
            content: (
                <div className="flex flex-col justify-center h-full max-w-5xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="flex-1 space-y-6">
                            <h2 className="text-display-sm">스마트<br />차트</h2>
                            <p className="text-body-lg text-gray-600">
                                5일간의 주가 추이와 거래량을 직관적으로 시각화합니다.<br />
                                상승/하락에 따른 색상 코딩으로 즉각적인 트렌드 파악이 가능합니다.
                            </p>
                            <ul className="space-y-4 mt-8">
                                <li className="flex items-center gap-4 text-h4">
                                    <span className="w-2 h-2 bg-black rounded-full"></span>
                                    인터랙티브 차트 (Recharts)
                                </li>
                                <li className="flex items-center gap-4 text-h4">
                                    <span className="w-2 h-2 bg-black rounded-full"></span>
                                    거래량 보조 지표
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 w-full bg-gray-50 p-8 rounded-none border border-gray-200 shadow-xl">
                            {/* Mock Chart Visualization */}
                            <div className="h-64 flex items-end justify-between gap-2 px-4 pb-4 border-b border-black">
                                {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: 0.5 + i * 0.1 }}
                                        className="w-full bg-black opacity-80"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'feature-2',
            title: '핵심 기능 2',
            content: (
                <div className="flex flex-col justify-center h-full max-w-5xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1 grid grid-cols-1 gap-4">
                            <div className="card p-6 border-l-4 border-red-500 bg-white shadow-lg">
                                <div className="flex justify-between">
                                    <span className="font-bold text-lg">삼성전자</span>
                                    <span className="text-red-500 font-bold">+2.5% ▲</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">목표가 도달 알림</p>
                            </div>
                            <div className="card p-6 border-l-4 border-blue-500 bg-white shadow-lg opacity-60">
                                <div className="flex justify-between">
                                    <span className="font-bold text-lg">SK하이닉스</span>
                                    <span className="text-blue-500 font-bold">-1.2% ▼</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">거래량 급증 알림</p>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 space-y-6">
                            <h2 className="text-display-sm">실시간<br />조건 알림</h2>
                            <p className="text-body-lg text-gray-600">
                                원하는 종목의 가격, 변동률, 거래량 조건을 설정하세요.<br />
                                조건이 충족되면 즉시 알림을 보내드립니다.
                            </p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'feature-3',
            title: '핵심 기능 3',
            content: (
                <div className="flex flex-col justify-center h-full max-w-4xl mx-auto space-y-8 text-center">
                    <h2 className="text-display-sm">브리핑 캘린더</h2>
                    <p className="text-h3 font-light text-gray-500">당신의 투자 기록을 체계적으로 관리합니다.</p>
                    <div className="grid grid-cols-7 gap-2 mt-8 max-w-2xl mx-auto">
                        {Array.from({ length: 31 }).map((_, i) => (
                            <div key={i} className={`aspect-square border ${i === 14 ? 'bg-black text-white' : 'border-gray-200'} flex items-center justify-center font-bold text-sm`}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            id: 'feature-4',
            title: '핵심 기능 4',
            content: (
                <div className="flex flex-col justify-center h-full max-w-5xl mx-auto space-y-8">
                    <h2 className="text-display-sm text-center mb-8">검색 및<br />즐겨찾기</h2>
                    <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                        <div className="w-full max-w-md">
                            <div className="relative">
                                <input type="text" placeholder="종목명 또는 초성 검색..." className="w-full text-xl px-6 py-4 border-2 border-black rounded-none focus:outline-none" readOnly />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">🔍</div>
                            </div>
                            <div className="mt-4 flex gap-2 justify-center">
                                <span className="badge-outline px-3 py-1">#삼성전자</span>
                                <span className="badge-outline px-3 py-1">#2차전지</span>
                                <span className="badge-outline px-3 py-1">#AI반도체</span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'pwa',
            title: '모바일 경험',
            content: (
                <div className="flex flex-col justify-center h-full max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="text-display-sm">PWA<br />완벽 지원</h2>
                            <p className="text-body-lg text-gray-600">
                                언제 어디서나 앱처럼 사용하세요.<br />
                                홈 화면에 추가하여 네이티브 앱과 동일한 경험을 누릴 수 있습니다.
                            </p>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl mb-2">📱</span>
                                    <span className="text-sm font-bold">모바일</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl mb-2">💻</span>
                                    <span className="text-sm font-bold">데스크탑</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl mb-2">⚡️</span>
                                    <span className="text-sm font-bold">빠른 속도</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <div className="w-64 h-[500px] border-8 border-black rounded-[3rem] p-4 flex flex-col justify-between bg-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-10"></div>
                                <div className="space-y-4 mt-8">
                                    <div className="h-8 bg-gray-100 rounded"></div>
                                    <div className="h-32 bg-gray-100 rounded"></div>
                                    <div className="h-16 bg-gray-100 rounded"></div>
                                    <div className="h-16 bg-gray-100 rounded"></div>
                                </div>
                                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'tech',
            title: '기술 스택',
            content: (
                <div className="flex flex-col justify-center h-full max-w-5xl mx-auto">
                    <h2 className="text-display-sm mb-12 text-center">TECH STACK</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="card-editorial p-6 text-center hover:bg-black hover:text-white transition-colors">
                            <div className="text-h3 font-bold mb-2">Next.js 16</div>
                            <div className="text-sm opacity-70">App Router</div>
                        </div>
                        <div className="card-editorial p-6 text-center hover:bg-black hover:text-white transition-colors">
                            <div className="text-h3 font-bold mb-2">React 19</div>
                            <div className="text-sm opacity-70">Server Components</div>
                        </div>
                        <div className="card-editorial p-6 text-center hover:bg-black hover:text-white transition-colors">
                            <div className="text-h3 font-bold mb-2">Tailwind 4</div>
                            <div className="text-sm opacity-70">Utility CSS</div>
                        </div>
                        <div className="card-editorial p-6 text-center hover:bg-black hover:text-white transition-colors">
                            <div className="text-h3 font-bold mb-2">PWA</div>
                            <div className="text-sm opacity-70">Offline Support</div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'outro',
            content: (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                    <h1 className="text-display font-bold">감사합니다</h1>
                    <p className="text-h3 text-gray-500">당신의 성공적인 투자를 위하여</p>
                    <div className="mt-12">
                        <button
                            onClick={() => router.push('/')}
                            className="btn btn-primary btn-xl rounded-none"
                        >
                            대시보드 시작하기
                        </button>
                    </div>
                </div>
            ),
        },
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(curr => curr + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(curr => curr - 1);
        }
    };

    return (
        <div className="h-screen w-full bg-white text-black overflow-hidden relative font-pretendard">
            {/* Navigation Controls */}
            <div className="absolute bottom-8 right-8 z-50 flex gap-4">
                <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="btn btn-secondary rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all"
                >
                    ←
                </button>
                <span className="flex items-center font-bold font-bebas text-xl w-16 justify-center">
                    {currentSlide + 1} / {slides.length}
                </span>
                <button
                    onClick={nextSlide}
                    disabled={currentSlide === slides.length - 1}
                    className="btn btn-primary rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    →
                </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 z-50">
                <motion.div
                    className="h-full bg-red-600"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Slide Content */}
            <div className="h-full w-full relative p-12 md:p-24 flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="h-full w-full"
                    >
                        {slides[currentSlide].title && (
                            <div className="absolute top-0 left-0 mt-8 ml-12 text-label text-gray-400 tracking-widest">
                                {slides[currentSlide].title}
                            </div>
                        )}
                        {slides[currentSlide].content}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
