import Image from 'next/image'

interface PDPOCertificateCardProps {
    companyName?: string
    certificateHref?: string
    logoSrc?: string
}

export default function PDPOCertificateCard({
    companyName = 'IOTEC Limited',
    certificateHref,
    logoSrc,
}: PDPOCertificateCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 max-w-md w-full">
            {/* Logo area */}
            <div className="mb-4">
                {logoSrc ? (
                    <Image
                        src={logoSrc}
                        alt="Personal Data Protection Office logo"
                        width={160}
                        height={48}
                        className="object-contain object-left h-12 w-auto"
                    />
                ) : (
                    /* Placeholder — replace with <Image> once you have the asset */
                    <div className="flex items-center gap-3">
                        {/* Shield icon */}
                        <svg
                            width="38"
                            height="38"
                            viewBox="0 0 36 36"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <path
                                d="M18 3L5 8.5V17C5 24.18 10.64 30.89 18 33C25.36 30.89 31 24.18 31 17V8.5L18 3Z"
                                fill="#8DC63F"
                                fillOpacity="0.15"
                                stroke="#8DC63F"
                                strokeWidth="1.5"
                            />
                            <circle cx="18" cy="14" r="2.5" fill="#8DC63F" />
                            <path
                                d="M12.5 23c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5"
                                stroke="#8DC63F"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>

                        {/* Text lockup */}
                        <div className="flex flex-col border-l border-gray-300 pl-3 leading-tight">
                            <span className="text-[10px] text-gray-500 tracking-wide">Personal</span>
                            <span className="text-sm font-black text-[#8DC63F] tracking-widest uppercase">DATA</span>
                            <span className="text-[10px] text-gray-500 tracking-wide">Protection</span>
                            <span className="text-[10px] font-bold text-[#8DC63F] tracking-widest uppercase">
                                OFFICE
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Divider */}
            <hr className="border-gray-200 mb-6" />

            {/* Content */}
            <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <h3 className="flex-1 text-lg sm:text-xl font-bold text-gray-900 leading-snug tracking-tight">
                        PDPO Certificate Of Registration
                    </h3>

                    {certificateHref ? (
                        <a
                            href={certificateHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="View certificate document"
                            className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-[#8DC63F] transition-colors duration-150"
                        >
                            <DocumentIcon />
                        </a>
                    ) : (
                        <span className="flex-shrink-0 mt-0.5 text-gray-400" aria-hidden="true">
                            <DocumentIcon />
                        </span>
                    )}
                </div>

                <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                    {companyName} is registered with the Personal Data Protection Office (PDPO)
                </p>
            </div>
        </div>
    )
}

function DocumentIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <polyline points="9 15 12 18 15 15" />
        </svg>
    )
}
