import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
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
                        Privacy Policy
                    </h1>

                    <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">1. Information Collection</h2>
                            <p>
                                At Zenith Journal, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Zenith Journal and how we use it.
                            </p>
                            <p className="mt-2">
                                We collect information you provide directly to us, such as when you create an account, update your profile, or use our interactive features. This includes:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Personal identification information (Name, email address)</li>
                                <li>Trading data and journal entries (for your private analysis)</li>
                                <li>Usage data and preferences</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
                            <p>
                                We use the information we collect in various ways, including to:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Provide, operate, and maintain our website</li>
                                <li>Improve, personalize, and expand our website</li>
                                <li>Understand and analyze how you use our website</li>
                                <li>Develop new products, services, features, and functionality</li>
                                <li>Send you emails (you can opt-out at any time)</li>
                                <li>Find and prevent fraud</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">3. Log Files</h2>
                            <p>
                                Zenith Journal follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">4. Data Security</h2>
                            <p>
                                We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">5. Third Party Privacy Policies</h2>
                            <p>
                                Zenith Journal's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">6. Children's Information</h2>
                            <p>
                                Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.
                            </p>
                            <p className="mt-2">
                                Zenith Journal does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-2">7. Consent</h2>
                            <p>
                                By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
                            </p>
                        </section>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
