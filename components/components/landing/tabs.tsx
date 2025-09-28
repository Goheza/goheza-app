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
        <section className="py-12 sm:py-20 ">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <Tabs defaultValue="brands" className="max-w-5xl mx-auto bg-transparent">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
                    >
                        <TabsList className="space-x-4">
                            <TabsTrigger value="brands" >
                                <span className=" font-bold">For Brands</span>
                            </TabsTrigger>

                            <TabsTrigger value="creators">
                                <span className="text-black font-bold">For Creators</span>
                            </TabsTrigger>

                            {/* Sliding underline (desktop only) */}
                           
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
