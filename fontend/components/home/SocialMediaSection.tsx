import React from "react";

interface SocialLink {
    id: number;
    name: string;
    username: string;
    image: string;
    url: string;
    // Màu thương hiệu cụ thể
    brandColor: string;
    // Màu nền mờ khi hover
    hoverBg: string;
}

const SOCIAL_LINKS: SocialLink[] = [
    {
        id: 1,
        name: "Tiktok",
        username: "@LikeFood_VN",
        image: "https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?q=80&w=1000&auto=format&fit=crop",
        url: "https://tiktok.com",
        brandColor: "group-hover:text-black dark:group-hover:text-white",
        hoverBg: "group-hover:border-black/20 dark:group-hover:border-white/20",
    },
    {
        id: 2,
        name: "Facebook",
        username: "LikeFood Official",
        image: "https://images.unsplash.com/photo-1562577944-46e604105214?q=80&w=1000&auto=format&fit=crop",
        url: "https://facebook.com",
        brandColor: "group-hover:text-blue-600",
        hoverBg:
            "group-hover:border-blue-600/30 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10",
    },
    {
        id: 3,
        name: "Instagram",
        username: "@likefood.gram",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop",
        url: "https://instagram.com",
        brandColor: "group-hover:text-pink-600",
        hoverBg:
            "group-hover:border-pink-600/30 group-hover:bg-pink-50/50 dark:group-hover:bg-pink-900/10",
    },
    {
        id: 4,
        name: "Youtube",
        username: "LikeFood Channel",
        image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=1000&auto=format&fit=crop",
        url: "https://youtube.com",
        brandColor: "group-hover:text-red-600",
        hoverBg:
            "group-hover:border-red-600/30 group-hover:bg-red-50/50 dark:group-hover:bg-red-900/10",
    },
];

const SocialMediaSection: React.FC = () => {
    return (
        <section className="py-12 bg-white dark:bg-stone-900 border-t border-slate-100 dark:border-stone-800">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header: Gọn gàng, nằm trên 1 dòng nếu màn hình lớn */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Connect with us
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-stone-400 hidden md:block">
                        Stay updated with our latest recipes & news
                    </p>
                </div>

                {/* Grid: Card Ngang (Horizontal) - Tiết kiệm chiều dọc tối đa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SOCIAL_LINKS.map((item) => (
                        <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`
                group relative flex items-center gap-4 p-3 rounded-xl 
                bg-white dark:bg-stone-800 
                border border-slate-200 dark:border-stone-700
                transition-all duration-300 ease-in-out
                hover:shadow-lg hover:-translate-y-1
                ${item.hoverBg}
              `}
                        >
                            {/* Avatar Image: Bo tròn nhỏ xinh */}
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    loading="lazy"
                                    className="w-full h-full rounded-full object-cover ring-2 ring-white dark:ring-stone-700 shadow-sm group-hover:scale-110 transition-transform duration-300"
                                />
                                {/* Dấu tích xanh giả lập (Badge) */}
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-stone-800 rounded-full p-0.5">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">
                                        ✓
                                    </div>
                                </div>
                            </div>

                            {/* Text Info */}
                            <div className="flex-1 min-w-0">
                                <h3
                                    className={`text-sm font-bold text-slate-900 dark:text-white truncate transition-colors ${item.brandColor}`}
                                >
                                    {item.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-stone-400 truncate group-hover:text-slate-700 dark:group-hover:text-stone-300">
                                    {item.username}
                                </p>
                            </div>

                            {/* Arrow Icon: Chỉ hiện màu khi hover */}
                            <div
                                className={`p-2 rounded-full bg-slate-50 dark:bg-stone-700/50 text-slate-400 group-hover:bg-white dark:group-hover:bg-stone-600 transition-all ${item.brandColor}`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-4 h-4 transform group-hover:rotate-45 transition-transform duration-300"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                                    />
                                </svg>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SocialMediaSection;
