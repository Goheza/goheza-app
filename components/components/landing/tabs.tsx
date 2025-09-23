'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import Image from 'next/image'
import brandImage from '@/assets/brand_item.png'
import creatorImage from '@/assets/creatorn.png'

export function BrandCreatorTabs() {
    const fadeUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    }

    return (
        <section className="py-12 sm:py-20 bg-gradient-to-br from-white to-neutral-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <Tabs defaultValue="brands" className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
                    >
                        <TabsList
                            className="relative grid w-full grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0 
              h-auto p-1 bg-white rounded-xl shadow-sm border border-gray-200"
                        >
                            <TabsTrigger
                                value="brands"
                                className="group relative flex items-center justify-center gap-2 
                text-sm sm:text-base lg:text-lg font-medium py-3 rounded-lg 
                transition-all duration-300 data-[state=active]:text-[#e85c51]"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                                >
                                    <path d="M11.25 4.507a.75.75..." />
                                </svg>
                                <span>For Brands</span>
                            </TabsTrigger>

                            <TabsTrigger
                                value="creators"
                                className="group relative flex items-center justify-center gap-2 
                text-sm sm:text-base lg:text-lg font-medium py-3 rounded-lg 
                transition-all duration-300 data-[state=active]:text-[#e85c51]"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                                >
                                    <path d="M12.963 2.25a.75.75..." />
                                </svg>
                                <span>For Creators</span>
                            </TabsTrigger>

                            {/* Sliding underline (desktop only) */}
                            <motion.div
                                layoutId="activeTab"
                                className="hidden sm:block absolute bottom-0 left-0 h-[3px] w-1/2 bg-[#e85c51] rounded-full"
                            />
                        </TabsList>
                    </motion.div>

                    {/* Brands Tab */}
                    <TabsContent value="brands" className="mt-8">
                        <motion.div
                            key="brands-content"
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            className="flex justify-center items-center p-4 sm:p-8 rounded-xl"
                        >
                            <Image
                                src={brandImage}
                                alt="Brand reaching out to creators"
                                className="w-full max-w-[600px] h-auto object-contain"
                                priority
                            />
                        </motion.div>
                    </TabsContent>

                    {/* Creators Tab */}
                    <TabsContent value="creators" className="mt-8">
                        <motion.div
                            key="creators-content"
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            className="flex justify-center items-center p-4 sm:p-8 rounded-xl"
                        >
                            <Image
                                src={creatorImage}
                                alt="Creator making content and earning money"
                                className="w-full max-w-[600px] h-auto object-contain"
                            />
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    )
}
