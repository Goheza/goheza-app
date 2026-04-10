'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import Image from 'next/image'
import brandImageDesktop from '@/assets/brand_desktop.png'
import creatorImageDesktop from '@/assets/creators_desktop.png'
import brandMobile from '@/assets/brandmobile.png'
import creatorMobile from '@/assets/creatormobile.png'

export default function BrandCreatorTabs() {
    const fadeUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    }

    return (
        <section className="  ">
            <div className="container     text-center">
                <Tabs defaultValue="brands" className="w-full mx-auto bg-transparent">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
                    >
                        <TabsList className="space-x-4">
                            <TabsTrigger value="brands">
                                <span className="font-bold">For Brands</span>
                            </TabsTrigger>

                            <TabsTrigger value="creators">
                                <span className="text-black font-bold">For Creators</span>
                            </TabsTrigger>
                        </TabsList>
                    </motion.div>

                    {/* Brands Tab */}
                    <TabsContent value="brands" className="mt-8">
                        <motion.div
                            key="brands-content"
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            className="flex justify-center items-center  sm:p-8 rounded-xl"
                        >
                            {/* Mobile Image */}
                            <Image
                                src={brandMobile}
                                alt="Brand reaching out to creators"
                                className="block sm:hidden w-[1200px]   h-auto"
                                priority
                            />
                            {/* Desktop Image */}
                            <Image
                                src={brandImageDesktop}
                                alt="Brand reaching out to creators"
                                className="hidden sm:block w-full max-w-[650px] h-auto object-contain"
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
                            {/* Mobile Image */}
                            <Image
                                src={creatorMobile}
                                alt="Creator making content and earning money"
                                className="block sm:hidden w-[1200px]  h-auto"
                            />
                            {/* Desktop Image */}
                            <Image
                                src={creatorImageDesktop}
                                alt="Creator making content and earning money"
                                className="hidden sm:block w-full max-w-[650px] h-auto object-contain"
                            />
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    )
}
