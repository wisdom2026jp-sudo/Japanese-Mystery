import React, { useState } from 'react';
import { X, Download, RefreshCw, ZoomIn } from 'lucide-react';

interface ImageGalleryProps {
    images: string[];
    onRegenerate?: (index: number) => void;
    isRegenerating?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
    images,
    onRegenerate,
    isRegenerating = false
}) => {
    const [selectedImage, setSelectedImage] = useState<number | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async (imageUrl: string, index: number) => {
        setIsDownloading(true);
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `story_image_${index + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
        setIsDownloading(false);
    };

    const handleRegenerate = (index: number) => {
        if (onRegenerate && !isRegenerating) {
            onRegenerate(index);
        }
    };

    return (
        <>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((url, i) => (
                    <div
                        key={i}
                        className="aspect-[9/16] rounded-2xl bg-slate-100 overflow-hidden relative group border-2 border-slate-100 hover:border-indigo-400 transition-all cursor-pointer"
                        onClick={() => setSelectedImage(i)}
                    >
                        <img src={url} className="w-full h-full object-cover" alt={`Story ${i + 1}`} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                                <button className="p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                                    <ZoomIn size={16} className="text-indigo-600" />
                                </button>
                            </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-lg font-black backdrop-blur-sm">
                            #{i + 1}
                        </div>
                    </div>
                ))}
            </div>

            {/* 모달 */}
            {selectedImage !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 닫기 버튼 */}
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 p-2 bg-white rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <X size={24} className="text-slate-900" />
                        </button>

                        {/* 이미지 */}
                        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                            <img
                                src={images[selectedImage]}
                                className="w-full aspect-[9/16] object-cover"
                                alt={`Story ${selectedImage + 1}`}
                            />
                        </div>

                        {/* 액션 버튼 */}
                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={() => handleDownload(images[selectedImage], selectedImage)}
                                disabled={isDownloading}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                <Download size={18} />
                                {isDownloading ? '다운로드 중...' : '다운로드'}
                            </button>

                            {onRegenerate && (
                                <button
                                    onClick={() => {
                                        handleRegenerate(selectedImage);
                                        setSelectedImage(null);
                                    }}
                                    disabled={isRegenerating}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-2xl font-black hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={18} className={isRegenerating ? 'animate-spin' : ''} />
                                    {isRegenerating ? '생성 중...' : '재생성'}
                                </button>
                            )}
                        </div>

                        {/* 이미지 정보 */}
                        <div className="mt-3 text-center">
                            <p className="text-white text-sm font-bold">
                                이미지 #{selectedImage + 1} / {images.length}
                            </p>
                            <p className="text-slate-400 text-xs mt-1">
                                9:16 세로 비율 • 2K 고화질
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
