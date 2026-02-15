import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Terms() {
    return (
        <div className="min-h-screen bg-background p-4 md:p-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>

                <GlassCard className="p-8 md:p-12">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-400 mb-8">
                        Terms & Conditions
                    </h1>

                    <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">1. Introduction</h2>
                            <p>
                                Welcome to Zenith Journal. By accessing or using our website and services, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">2. Use License</h2>
                            <p>
                                Permission is granted to temporarily download one copy of the materials (information or software) on Zenith Journal's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license, you may not:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Modify or copy the materials;</li>
                                <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                                <li>Attempt to decompile or reverse engineer any software contained on Zenith Journal's website;</li>
                                <li>Remove any copyright or other proprietary notations from the materials; or</li>
                                <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">3. Disclaimer</h2>
                            <p>
                                The materials on Zenith Journal's website are provided on an 'as is' basis. Zenith Journal makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                            </p>
                            <p className="mt-2 text-primary/80 italic">
                                Trading involves substantial risk of loss and is not suitable for every investor. Zenith Journal is a tool for analysis and journaling, not financial advice.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">4. Limitations</h2>
                            <p>
                                In no event shall Zenith Journal or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Zenith Journal's website.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">5. Accuracy of Materials</h2>
                            <p>
                                The materials appearing on Zenith Journal's website could include technical, typographical, or photographic errors. Zenith Journal does not warrant that any of the materials on its website are accurate, complete, or current. Zenith Journal may make changes to the materials contained on its website at any time without notice.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">6. Links</h2>
                            <p>
                                Zenith Journal has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Zenith Journal of the site. Use of any such linked website is at the user's own risk.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">7. Modifications</h2>
                            <p>
                                Zenith Journal may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these Terms of Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">8. Governing Law</h2>
                            <p>
                                These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                            </p>
                        </section>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
