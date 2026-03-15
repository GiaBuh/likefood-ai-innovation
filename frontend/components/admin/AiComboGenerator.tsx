import React, { useState } from 'react';
import { generateAiCombo, AiComboResponse, publishAiCombo } from '../../services/shopApi';
import { Product } from '../../types';

interface AiComboGeneratorProps {
  products: Product[];
}

const AiComboGenerator: React.FC<AiComboGeneratorProps> = ({ products }) => {
  const [hashtag, setHashtag] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiComboResponse | null>(null);
  const [error, setError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleToggleItem = (productName: string) => {
    setSelectedItems(prev => 
      prev.includes(productName) 
        ? prev.filter(item => item !== productName)
        : [...prev, productName]
    );
  };

  const handleGenerate = async () => {
    if (!hashtag.trim()) {
      setError('Vui lòng nhập Hashtag (VD: #championsleague)');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Vui lòng chọn ít nhất 1 sản phẩm cho Combo!');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await generateAiCombo(hashtag, selectedItems);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gọi AI.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!result || !result.id) return;
    
    setIsPublishing(true);
    setError('');
    
    try {
      await publishAiCombo(result.id);
      setPublishSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi đưa lên cửa hàng.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Form */}
        <div className="flex-1 bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-700">
          <div className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              🤖 AI Trend Combo Generator
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              Nhập trend đang viral trên TikTok và để Gemini & Pollinations AI tự vẽ ra chiến dịch bán hàng!
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                Trending Hashtag <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">#</span>
                <input
                  type="text"
                  placeholder="championsleague, rapviet, blackpink..."
                  className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white"
                  value={hashtag.replace('#', '')}
                  onChange={(e) => setHashtag('#' + e.target.value.replace('#', ''))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Chọn kho hàng cần đẩy (Items) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                {products.map(p => (
                  <label key={p.id} className="flex items-center space-x-2 p-2 hover:bg-white dark:hover:bg-neutral-700 rounded cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded text-purple-600 focus:ring-purple-500"
                      checked={selectedItems.includes(p.name)}
                      onChange={() => handleToggleItem(p.name)}
                    />
                    <span className="text-sm text-gray-700 dark:text-neutral-300 truncate">{p.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-2">Đã chọn: {selectedItems.length} món</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white shadow-lg transition-all
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 hover:shadow-xl hover:-translate-y-0.5'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang vận dụng não bộ AI...
                </span>
              ) : '🚀 Bắt AI Tạo Combo!'}
            </button>
          </div>
        </div>

        {/* Right Result View */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {loading && !result && (
            <div className="flex flex-col items-center justify-center space-y-4 text-center p-8">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-pulse" />
                <div className="absolute inset-0 border-t-4 border-purple-600 rounded-full animate-spin" />
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 animate-pulse">
                Đang triệu hồi Giám đốc Marketing Gemini<br/>và Designer Pollinations AI...
              </p>
            </div>
          )}

          {!loading && !result && (
             <div className="text-center p-12 text-neutral-400 dark:text-neutral-500 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl w-full h-full flex flex-col items-center justify-center">
               <span className="text-4xl mb-3">✨</span>
               <p>Combo Siêu Cấp Vô Địch sẽ xuất hiện ở đây!</p>
             </div>
          )}

          {result && (
            <div className="w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-neutral-700 transform transition-all hover:scale-[1.02]">
              <div className="relative h-64 bg-neutral-200 dark:bg-neutral-700 overflow-hidden group">
                {result.imageUrl ? (
                  <img 
                    src={result.imageUrl} 
                    alt="AI Generated Banner" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">Không tạo được ảnh</div>
                )}
                
                {/* Discount Badge */}
                <div className="absolute top-4 right-4 bg-red-500 text-white font-black text-xl px-4 py-2 rounded-full transform rotate-12 shadow-lg border-2 border-white">
                  -{result.discount_percentage}%
                </div>
                
                {/* Image Prompt Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white/80 text-xs italic line-clamp-2">Prompt: {result.image_prompt}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                  HOT TREND
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1 leading-tight">
                  {result.combo_name}
                </h3>
                <p className="text-pink-500 font-bold mb-4">
                  "{result.slogan}"
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl relative">
                  <div className="text-neutral-600 dark:text-neutral-300 text-sm whitespace-pre-wrap italic">
                    {result.description}
                  </div>
                  {/* Decorative quote marks */}
                  <span className="absolute top-2 left-2 text-4xl text-gray-200 dark:text-gray-700 opacity-50 block leading-none font-serif -z-10">"</span>
                </div>
                
                <div className="mt-6">
                  {publishSuccess ? (
                    <div className="w-full py-2.5 bg-green-500 text-white rounded-lg font-medium flex justify-center flex-col items-center">
                      <span>✅ Đã đưa lên cửa hàng thành công!</span>
                      <span className="text-xs opacity-75">Bạn có thể xem ở mục "Sản phẩm"</span>
                    </div>
                  ) : (
                    <button 
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                        isPublishing 
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-neutral-700 dark:hover:bg-neutral-100'
                      }`}
                    >
                      {isPublishing ? 'Đang xuất bản...' : 'Publish to Store (Sẵn sàng)'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiComboGenerator;
