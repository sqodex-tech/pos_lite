"use client";

import React, { useState, useEffect } from 'react';
import {
    Phone,
    Mail,
    Globe,
    MessageCircle,
    Send,
    Clock,
    ShieldCheck,
    ExternalLink,
    ArrowRight,
    Headphones,
    HelpCircle,
    LogIn,
    ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/UI';
import Link from 'next/link';

export default function SupportPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    const contactInfo = [
        {
            icon: <Phone className="w-6 h-6" />,
            label: "Phone Support",
            value: "+92 327 9048797",
            link: "tel:+923279048797",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            icon: <Mail className="w-6 h-6" />,
            label: "Email Us",
            value: "contact@sqodex.com",
            link: "mailto:contact@sqodex.com",
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        },
        {
            icon: <Globe className="w-6 h-6" />,
            label: "Portfolio",
            value: "www.sqodex.com",
            link: "https://www.sqodex.com/",
            color: "text-primary",
            bg: "bg-primary/5"
        }
    ];

    const faqs = [
        { q: "How do I change my subscription?", a: "Navigate to the Plans page and click 'Switch Plan'. You can choose immediate or scheduled changes." },
        { q: "Can I manage multiple stores?", a: "Yes, depending on your plan, you can create and manage multiple branches under one account." },
        { q: "What happens if a payment fails?", a: "The system will retry automatically. You will receive an email notification with retry options." }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Premium Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href={isLoggedIn ? "/store" : "/"}>
                        <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all group shadow-sm">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            {isLoggedIn ? "Back to Dashboard" : "Back to Home"}
                        </button>
                    </Link>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Headphones className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Support Center</span>
                    </div>

                    <div className="w-[140px]"></div> {/* Spacer for perfect centering */}
                </div>
            </nav>

            <div className="max-w-6xl mx-auto space-y-12 py-12 px-6 text-slate-900 dark:text-white">
                {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-50 dark:bg-slate-900 p-12 text-slate-900 dark:text-white shadow-2xl border border-slate-200/50 dark:border-slate-800/50">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-[80px]"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="space-y-6 text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-primary-light font-black text-xs uppercase tracking-widest"
                        >
                            <Headphones className="w-4 h-4" />
                            24/7 Priority Support
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-6xl font-black tracking-tight"
                        >
                            How can we <br />
                            <span className="text-primary-light">help you?</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-600 dark:text-slate-400 text-lg font-medium max-w-md"
                        >
                            Our dedicated team is ready to assist you with any questions regarding your account, billing, or technical issues.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="hidden lg:block relative"
                    >
                        <div className="w-64 h-64 bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center p-8">
                            <div className="grid grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className={`w-12 h-12 rounded-xl bg-primary/${(i + 1) * 20} animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }}></div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FAQ & Contact Cards */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {contactInfo.map((item, index) => (
                            <motion.a
                                key={index}
                                href={item.link}
                                target={item.link.startsWith('http') ? '_blank' : '_self'}
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group p-8 bg-white/99 dark:bg-slate-900/99 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                            >
                                <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                    {item.icon}
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{item.label}</p>
                                <p className="font-bold text-slate-900 dark:text-white break-all">{item.value}</p>
                                <div className="mt-4 flex items-center gap-2 text-primary font-black text-sm">
                                    {item.label === "Email Us" ? "Send Message" : item.label === "Phone Support" ? "Call Now" : "Visit Site"}
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </div>
                            </motion.a>
                        ))}
                    </div>

                    <div className="p-10 bg-white/99 dark:bg-slate-900/99 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white">
                                <HelpCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Quick answers to common inquiries.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {faqs.map((faq, i) => (
                                <div key={i} className="p-6 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors hover:bg-white/80 dark:hover:bg-slate-900/80">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                        {faq.q}
                                    </h3>
                                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed pl-4.5">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contact Form / Login CTA */}
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-10 bg-white/99 dark:bg-slate-900/99 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-xl overflow-hidden relative"
                    >
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <MessageCircle className="w-6 h-6 text-primary" />
                            Quick Contact
                        </h2>

                        <AnimatePresence mode="wait">
                            {isLoggedIn ? (
                                <motion.div
                                    key="contact-form"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Subject</label>
                                        <input
                                            type="text"
                                            className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold placeholder:text-slate-300 text-slate-700 dark:text-slate-300"
                                            placeholder="Feedback"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Message</label>
                                        <textarea
                                            className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold placeholder:text-slate-300 resize-none text-slate-700 dark:text-slate-300"
                                            placeholder="Your feedback is valuable to us"
                                        ></textarea>
                                    </div>
                                    <Button className="w-full h-14 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black gap-2 mt-2 shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
                                        <Send className="w-4 h-4" />
                                        Send Message
                                    </Button>

                                    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 space-y-4">
                                        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-bold text-sm">
                                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                            Secured message transmission
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-bold text-sm">
                                            <Clock className="w-5 h-5 text-amber-600" />
                                            Response within 2 hours
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="login-cta"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="py-6 text-center"
                                >
                                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <LogIn className="w-10 h-10 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center">Sign in Required</h3>
                                    <p className="text-slate-500 font-medium mb-8 text-center px-4">Please log in to your account to send us a secure message.</p>

                                    <Link href="/login" className="block">
                                        <Button className="w-full h-14 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black gap-3 shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
                                            Login to Continue
                                            <ArrowRight className="w-5 h-5" />
                                        </Button>
                                    </Link>

                                    <p className="mt-6 text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
                                        Trusted by 1000+ Businesses
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Social/Bio Section */}
                    <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] text-slate-900 dark:text-white space-y-4 shadow-xl border border-slate-200/50 dark:border-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-light/20">
                                <div className="w-full h-full bg-primary-light/10 flex items-center justify-center font-black text-xl">SK</div>
                            </div>
                            <div>
                                <p className="font-black">Salman Khan</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Lead Developer</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                            Crafting premium digital experiences. Visit my portfolio to see more of my work in advanced agentic coding and full-stack development.
                        </p>
                        <a
                            href="https://www.sqodex.com/"
                            target="_blank"
                            className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                        >
                            <span className="font-bold text-slate-900 dark:text-white">View Portfolio</span>
                            <ArrowRight className="w-4 h-4 text-primary-light group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}
