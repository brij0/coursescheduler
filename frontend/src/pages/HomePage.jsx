import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Calculator,
  Users,
  Zap,
  ChevronDown,
  Star,
  Coffee,
  Brain,
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "../components/Navbar";

// Reused AnimatedLines (mirrors AboutPage)
const AnimatedLines = () => {
  const [curves, setCurves] = useState([]);

  const generateCurve = (id) => {
    const edge = ["top", "right", "bottom", "left"][Math.floor(Math.random() * 4)];
    let sx, sy;
    switch (edge) {
      case "top":
        sx = Math.random() * 100; sy = -5; break;
      case "bottom":
        sx = Math.random() * 100; sy = 105; break;
      case "left":
        sx = -5; sy = Math.random() * 100; break;
      case "right":
        sx = 105; sy = Math.random() * 100; break;
      default:
        sx = -5; sy = -5;
    }
    const endRadius = 18 + Math.random() * 22;
    const theta = Math.random() * Math.PI * 2;
    const ex = Math.min(100, Math.max(0, sx + Math.cos(theta) * endRadius));
    const ey = Math.min(100, Math.max(0, sy + Math.sin(theta) * endRadius));
    const midX = (sx + ex) / 2;
    const midY = (sy + ey) / 2;
    const dx = ex - sx;
    const dy = ey - sy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const curveStrength = Math.min(12, len * 0.6) * (Math.random() * 0.6 + 0.4);
    const bendDir = Math.random() < 0.5 ? 1 : -1;
    const c1x = midX + nx * curveStrength * bendDir * 0.6 + (Math.random() - 0.5) * 4;
    const c1y = midY + ny * curveStrength * bendDir * 0.6 + (Math.random() - 0.5) * 4;
    const c2x = midX + nx * curveStrength * bendDir * 1.0 + (Math.random() - 0.5) * 4;
    const c2y = midY + ny * curveStrength * bendDir * 1.0 + (Math.random() - 0.5) * 4;
    const duration = 5.5 + Math.random() * 3;
    const delay = Math.random() * 0.4;

    return {
      id,
      d: `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`,
      duration,
      delay,
      strokeWidth: 0.2 + Math.random() * 0.1,
      opacity: 0.18 + Math.random() * 0.25,
      hue: 200 + Math.random() * 18,
      dash: Math.random() < 0.5
        ? `${6 + Math.random() * 8} ${10 + Math.random() * 14}`
        : undefined
    };
  };

  useEffect(() => {
    setCurves(Array.from({ length: 22 }, (_, i) => generateCurve(i)));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurves(prev => {
        if (!prev.length) return prev;
        const idx = Math.floor(Math.random() * prev.length);
        const next = [...prev];
        next[idx] = generateCurve(Date.now());
        return next;
      });
    }, 850);
    return () => clearInterval(interval);
  }, []);

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
      {curves.map(c => (
        <motion.path
          key={c.id}
          d={c.d}
          fill="none"
          stroke={`hsl(${c.hue} 100% 40%)`}
          strokeWidth={c.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={c.dash}
          initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: prefersReduced ? c.opacity : [0, c.opacity, 0]
            }}
            transition={{
              duration: c.duration,
              delay: c.delay,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.8 + Math.random() * 1.4
            }}
            style={{ mixBlendMode: "plus-lighter", filter: "blur(0.1px)" }}
        />
      ))}
    </svg>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleStartJourney = () => {
    navigate("/auth");
  };

  // Typewriter effect component
  const TypewriterText = ({ text, delay = 0, Component = "span" }) => {
    return (
      <Component delay={delay}>
        {text.split("").map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.05,
              delay: delay + index * 0.03,
              ease: "easeOut",
            }}
          >
            {char}
          </motion.span>
        ))}
      </Component>
    );
  };

  // Highlight animation
  const AnimatedHighlight = ({ children, delay = 0 }) => {
    return (
      <span className="relative inline-block">
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-primary-300 to-primary-300 -skew-x-12 -z-10"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{
            scaleX: [0, 1, 1, 0],
            originX: [0, 0, 1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
            delay: delay + 1,
          }}
        />
        <span className="relative z-10 font-bold text-neutral-900 px-2">
          {children}
        </span>
      </span>
    );
  };

  const features = [
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "GPA Calculator",
      description:
        "Calculate what grade you need on that final. Sleep better the night before.",
      color: "from-accent-500 to-accent-600",
      path: "/gpa-calculator",
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Course Scheduler",
      description:
        "Find conflict-free schedules in seconds. Keep your Fridays open.",
      color: "from-primary-500 to-primary-600",
      path: "/conflict-free-schedule",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Event Exporter",
      description:
        "Export your course schedule to your favorite calendar app.",
      color: "from-green-500 to-green-600",
      path: "/schedule",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Co-op Forum",
      description:
        "Unfiltered co-op insights. The stuff not in the brochures.",
      color: "from-primary-600 to-accent-500",
      path: "/coop-forum",
    },
  ];

  // New timeline data (extracted out of JSX for re‑use / cleanliness)
  const timelineEvents = [
    {
      year: "December 2022",
      title: "The Chemistry Catastrophe",
      icon: "AlertTriangle",
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description:
        "Both Mann and Brijesh had to drop CHEM*1040 after missing 3-4 lab deadlines. They thought 'how can we ever forget a deadline?' - turns out, they could.",
      impact: "💔 First reality check about academic organization",
    },
    {
      year: "January 2023",
      title: "The Scheduling Nightmare",
      icon: "BookOpen",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      description:
        "Taking 6 courses per semester, both did course selection by manually checking hundreds of permutations, picking sections that 'weren't red and looked fine' definitely not optimized.",
      impact: "📊 Realized there had to be a better way",
    },
    {
      year: "September 2024",
      icon: "Calendar",
      title: "Missed Deadlines Strike Again",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      description:
        "Brijesh missed another 10% assignment. While he didn't drop the course this time, he took an L and thought 'there has to be a way to fix this issue, right?' The library's paper calendars seemed logical, but reading course outlines and adding deadlines manually felt like torture.",
    },
    {
      year: "November 2024",
      title: "AI Experimentation",
      icon: "Zap",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description:
        "Brijesh decided to use LLMs to extract events from course outlines. Sounds simple, right? Wrong! LLMs lacked context about real sections. Web scraping had to join the party.",
    },
    {
      year: "January 2025",
      title: "The Partnership Forms",
      icon: "Users",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description:
        "Before his co-op, Brijesh showed the LLM project to Mann. Mann was still drowning in Excel juggling multiple grading schemes. They decided to build one unified platform.",
    },
    {
      year: "August 2025",
      title: "The Final Piece",
      icon: "MessageCircle",
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description:
        "After GPA tools, scheduling, and assignment extraction, a missing layer emerged: co-op knowledge sharing. A focused forum was born.",
    },
    {
      year: "Today",
      title: "ugflow Lives",
      icon: "CheckCircle",
      color: "text-primary-500",
      bgColor: "bg-primary-50",
      borderColor: "border-primary-200",
      description:
        "From personal academic struggles to a comprehensive student platform. Built by students who lived the pain points.",
      impact: "Making student life easier, one feature at a time",
    },
  ];

  // Timeline ambient background (behind stacked cards)
  const TimelineSceneBackground = () => (
    <div className="absolute inset-0 pointer-events-none">
      {/* Hero-style grid (two patterns) */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="journey-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#90a1ae" strokeWidth="0.3" opacity="0.12" />
          </pattern>
          <pattern id="journey-grid-bold" width="45" height="45" patternUnits="userSpaceOnUse">
            <path d="M 150 0 L 0 0 0 150" fill="none" stroke="#90a1ae" strokeWidth="0.7" opacity="0.18" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#journey-grid)" />
        <rect x="0" y="0" width="100%" height="100%" fill="url(#journey-grid-bold)" />
      </svg>
      {/* Center soft lift */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85),transparent_72%)]" />
      {/* Floating faint highlight ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 560,
          height: 560,
          border: "1px solid rgba(69,104,130,0.18)",
          filter: "blur(1px)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );

  // New global background component
  const GlobalBackground = React.memo(() => {
    const stars = useMemo(
      () =>
        Array.from({ length: 70 }).map((_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 1.1 + 0.4,
          delay: Math.random() * 6,
          dur: 5 + Math.random() * 6,
        })),
      []
    );
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#f7fafc]">
        {/* (unchanged large gradients / rings / aurora) */}
        <div className="absolute -top-40 -left-32 w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(70,120,150,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute top-[30%] -right-48 w-[55vw] h-[55vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(120,170,200,0.20),transparent_70%)] blur-2xl" />
        <div className="absolute bottom-[-25%] left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(80,130,160,0.12),transparent_70%)] blur-3xl" />
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg,rgba(90,140,170,0.12),rgba(160,200,220,0.06) 40%,rgba(90,140,170,0.15) 60%,rgba(180,220,235,0.08))",
            mixBlendMode: "plus-lighter",
            mask: "linear-gradient(to bottom,transparent,black 15%,black 85%,transparent)",
          }}
          animate={{ backgroundPosition: ["0% 0%", "120% 100%", "0% 0%"] }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0">
          {stars.map(s => (
            <motion.span
              key={s.id}
              className="absolute rounded-full bg-primary-500"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                opacity: 0.18,
                boxShadow: "0 0 4px 1px rgba(69,104,130,0.35)",
                willChange: "opacity, transform",
              }}
              animate={{ opacity: [0.15, 0.6, 0.15], scale: [1, 1.5, 1] }}
              transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
            />
          ))}
        </div>
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='4' stitchTiles='stitch'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='0.55'/></svg>\")",
          }}
        />
      </div>
    );
  });

  // Subcomponent: animated card within pinned timeline
  const TimelineCard = ({ event, index, total, scrollYProgress }) => {
    const segment = 1 / total;
    const start = index * segment;
    const end = (index + 1) * segment;
    const smoothProgress = useSpring(scrollYProgress, {
      stiffness: 110,
      damping: 25,
      mass: 0.25,
    });
    const segmentProgress = useTransform(smoothProgress, [start, end], [0, 1], { clamp: true });

    const iconMap = { AlertTriangle, BookOpen, Calendar, Zap, Users, MessageCircle, CheckCircle };
    const IconComponent = iconMap[event.icon];

    const extendedFadePoint = Math.min(1, end + segment * 0.3);

    const opacity = index === 0
      ? useTransform(
          smoothProgress,
          [0, segment * 0.05, end, extendedFadePoint],
          [1, 1, 1, 0]
        )
      : useTransform(segmentProgress, [0, 0.15, 0.55, 0.85, 1], [0, 1, 1, 0.6, 0]);

    const scale = index === 0
      ? useTransform(smoothProgress, [0, end, extendedFadePoint], [1, 1, 0.96])
      : useTransform(segmentProgress, [0, 0.15, 0.5, 1], [0.9, 1, 1, 0.95]);

    const y = index === 0
      ? useTransform(smoothProgress, [0, end, extendedFadePoint], [0, 0, -40])
      : useTransform(segmentProgress, [0, 0.2, 0.5, 1], [60, 0, 0, -50]);

    const rotate = useTransform(segmentProgress, [0, 0.5, 1], [2.5, 0, -2]);

    return (
      <motion.div
        style={{
          opacity,
          scale,
          y,
          rotate,
          pointerEvents: "none",
          willChange: "transform, opacity",
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="relative w-full max-w-[48rem] px-6 sm:px-0 pointer-events-auto will-change-transform">
          <div className="relative group">
            {/* Outer subtle glass ring */}
            <div className="absolute -inset-[3px] rounded-[30px] bg-gradient-to-br from-primary-400/25 via-white/40 to-primary-100/10 opacity-70 group-hover:opacity-100 transition-opacity duration-400" />
            {/* Inner hairline frame */}
            <div className="relative rounded-[28px] p-[1.5px] bg-gradient-to-br from-white/70 via-primary-100/30 to-primary-300/10">
              {/* Card core */}
              <div className="relative rounded-[26px] bg-white/82 backdrop-blur-xl p-10 shadow-[0_6px_34px_-10px_rgba(60,100,130,0.22)] overflow-hidden">
                {/* Left accent rail (animated focus) */}
                <motion.div
                  className="absolute top-8 bottom-8 left-0 w-[6px] rounded-r-full bg-gradient-to-b from-primary-400 via-primary-500 to-primary-300"
                  style={{
                    opacity: useTransform(segmentProgress, [0, 0.25, 0.9, 1], [0.12, 0.6, 0.45, 0]),
                    filter: "brightness(1.05)",
                  }}
                />
                
                {/* Subtle pattern + noise overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.18] mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg,rgba(90,115,135,0.35) 0 1px,transparent 1px 26px),repeating-linear-gradient(45deg,rgba(90,115,135,0.22) 0 1px,transparent 1px 34px)",
                    mask: "linear-gradient(to bottom,transparent,black 10%,black 90%,transparent)",
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='110' height='110'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/></filter><rect width='110' height='110' filter='url(%23n)' opacity='0.55'/></svg>\")",
                  }}
                />

                {/* Hover shimmer (very light) */}
                <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(115deg,transparent,rgba(255,255,255,0.55),transparent)] before:translate-x-[-120%] group-hover:before:animate-[shine_1.4s_ease] @keyframes shine{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}" />
                </div>

                {/* Year & Icon Row */}
                <div className="flex items-start mb-8">
                  <motion.div
                    className={`w-20 h-20 rounded-3xl flex-shrink-0 flex items-center justify-center mr-7 shadow-inner ${event.bgColor} relative`}
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    transition={{ type: "spring", stiffness: 240, damping: 18 }}
                    style={{ willChange: "transform" }}
                  >
                    <IconComponent className={`w-10 h-10 ${event.color}`} />
                    <div className="absolute inset-0 rounded-3xl bg-white/15 mix-blend-overlay" />
                  </motion.div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold tracking-wide bg-white/85 border border-primary-200/70 text-neutral-700 shadow-sm">
                        {event.year}
                      </span>
                      {event.impact && (
                        <span className="px-3.5 py-1.5 rounded-full text-[12px] font-medium bg-gradient-to-r from-primary-500/15 to-primary-400/10 text-primary-700 border border-primary-300/40">
                          {event.impact}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-[2.15rem] leading-tight font-display font-bold text-neutral-800 relative">
                      {event.title || `Chapter ${index + 1}`}
                      <span className="block mt-3 h-[3.5px] w-16 rounded-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-300" />
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[1.12rem] text-neutral-700 leading-relaxed mb-10">
                  {event.description}
                </p>

                {/* Progress dots (slightly larger) */}
                <div className="mt-6 flex items-center justify-center gap-2.5">
                  {Array.from({ length: total }).map((_, i) => (
                    <motion.span
                      key={i}
                      className={`h-3 w-3 rounded-full ${
                        i === index
                          ? "bg-primary-500 shadow-[0_0_0_5px_rgba(69,104,130,0.18)]"
                          : "bg-neutral-300/70"
                      }`}
                      initial={false}
                      animate={i === index ? { scale: 1.35 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 250, damping: 18 }}
                      style={{ willChange: "transform" }}
                    />
                  ))}
                </div>

                {/* Bottom fade (subtle) */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/85 via-white/40 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Pinned timeline container
  const TimelinePinned = () => {
    const pinRef = useRef(null);
    const startOffset = "start 75%";
    const { scrollYProgress } = useScroll({
      target: pinRef,
      offset: [startOffset, "end end"],
    });

    return (
      <div
        ref={pinRef}
        style={{ height: `${timelineEvents.length * 100}vh` }}
        className="relative"
      >
        <div className="sticky top-24 h-[calc(100vh-6rem)] [contain:layout_paint_size] will-change-transform">
          <TimelineSceneBackground />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-px h-[70%] bg-gradient-to-b from-transparent via-primary-400/65 to-transparent drop-shadow-[0_0_5px_rgba(69,104,130,0.4)]" />
          </div>
          {timelineEvents.map((evt, i) => (
            <TimelineCard
              key={i}
              event={evt}
              index={i}
              total={timelineEvents.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="min-h-screen">
      <GlobalBackground />
      <Helmet>
        <title>ugflow | Course Scheduler & GPA Calculator for University Students</title>
        <meta name="description" content="Schedule university courses conflict-free, calculate GPA, and access co-op resources. Built by University of Guelph students for students." />
        <meta name="keywords" content="university course scheduler, GPA calculator, UGuelph, ugflow, academic planning, course conflicts" />
        <link rel="canonical" href="https://ugflow.com/" />
        <meta property="og:title" content="ugflow | Student Academic Tools" />
        <meta property="og:description" content="Schedule university courses conflict-free, calculate GPA, and access co-op resources." />
        <meta property="og:url" content="https://ugflow.com/" />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <Navbar />

      {/* Hero Section (updated) */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
        <div className="absolute inset-0">
          {/* Animated lines layer */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <AnimatedLines />
          </div>

          {/* Grid Base */}
          <svg className="absolute inset-0 w-full h-full z-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#90a1ae" strokeWidth="0.3" opacity="0.15" />
              </pattern>
              <pattern id="grid-pattern-bold" width="45" height="45" patternUnits="userSpaceOnUse">
                <path d="M 150 0 L 0 0 0 150" fill="none" stroke="#90a1ae" strokeWidth="0.7" opacity="0.25" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-pattern)" />
            <rect x="0" y="0" width="100%" height="100%" fill="url(#grid-pattern-bold)" />
          </svg>

          {/* Pulse points */}
          {[...Array(4)].map((_, i) => {
            const posX = Math.random() * 90 + 5;
            const posY = Math.random() * 90 + 5;
            return (
              <motion.div
                key={`pulse-${i}`}
                className="absolute rounded-full bg-primary-400/30"
                style={{
                  width: 14 + Math.random() * 14,
                  height: 14 + Math.random() * 14,
                  left: `${posX}%`,
                  top: `${posY}%`,
                  filter: "blur(6px)"
                }}
                animate={{ scale: [1, 1.6, 1], opacity: [0.12, 0.45, 0.12] }}
                transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, ease: "easeInOut" }}
              />
            );
          })}

          {/* Ambient orb */}
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-gradient-radial from-primary-400/10 to-transparent pointer-events-none z-30"
              animate={{ x: [0, 100, -100, 0], y: [0, -100, 100, 0], scale: [1, 1.1, 0.9, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{
                filter: 'blur(20px)',
                boxShadow: '0 0 40px rgba(69, 104, 130, 0.5)',
                mixBlendMode: 'lighten',
              }}
            />
        </div>

        {/* Hero Content (parallax only on content) */}
        <motion.div
          className="relative z-20 text-center px-4 max-w-6xl mx-auto"
          style={{ y, opacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200/50 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-neutral-700">
                Your Academic Success Starts Here
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-display font-black mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <motion.span
                className="text-primary-600"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
              >
                ug
              </motion.span>
              <motion.span
                className="text-neutral-800"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                 flow
              </motion.span>
            </motion.h1>

            <div className="text-xl md:text-2xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.4 }}
              >
                <TypewriterText
                  text="Your academic life just got an upgrade. Schedule courses, calculate GPAs, and navigate co-op like a pro. "
                  delay={1.6}
                />
                <TypewriterText
                  text="Because your focus belongs on learning, not logistics."
                  delay={4.8}
                  Component={AnimatedHighlight}
                />
              </motion.p>
            </div>

            <motion.div
              className="flex justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 4.2 }}
            >
              <motion.button
                onClick={handleStartJourney}
                className="group relative px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 overflow-hidden"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-primary-400/40 to-primary-600/40 blur-md rounded-full" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-100/50 to-transparent -skew-x-12"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "200%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <span className="relative z-10 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4 mr-2.5" />
                  <span className="tracking-wide">Try it Now</span>
                  <motion.div
                    className="ml-2.5 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 3.33337L12.6667 8.00004L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-neutral-400" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-neutral-800">
              Why Students <span className="text-primary-600">Love Us</span>
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              We've been in your shoes. Late nights, scheduling conflicts, GPA
              anxiety. That's why we built tools that actually work.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group relative p-8 rounded-2xl elegant-card cursor-pointer"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                onClick={() => navigate(feature.path)}
              >
                <motion.div
                  className="inline-flex p-4 rounded-xl bg-primary-500 text-white mb-6 transition-transform duration-300 shadow-lg"
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -5, 5, 0],
                    boxShadow: "0 10px 25px rgba(69,104,130,0.3)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {feature.icon}
                </motion.div>

                <h3 className="text-2xl font-bold mb-4 text-neutral-800 font-display">
                  {feature.title}
                </h3>

                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>

                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section (revised) */}
      <section className="py-20 px-4 bg-gradient-to-br from-white via-primary-50/30 to-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold mb-6 text-neutral-800">
              Our <span className="text-primary-600">Journey</span>
            </h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto mt-8 rounded-full"></div>
            <p className="mt-6 text-neutral-600 max-w-2xl mx-auto text-lg">
              Scroll to reveal each chapter. The story assembles itself.
            </p>
          </motion.div>

          {/* New pinned / shuffle timeline */}
          <TimelinePinned />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary-500">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Enough With the All-Nighters
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Built by two students who were sick of missing deadlines and calculating GPAs by hand. If you're reading this at 2am trying to figure out your schedule, we've got you.
            </p>

            <motion.button
              onClick={handleStartJourney}
              className="group relative px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="absolute inset-0 bg-white rounded-full" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/60 blur-md rounded-full" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-100/50 to-transparent -skew-x-12"
                initial={{ x: "-100%" }}
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <span className="relative z-10 flex items-center justify-center text-primary-500">
                <GraduationCap className="w-5 h-5 mr-2.5" />
                <span className="tracking-wide">I need this. NOW!</span>
                <motion.div
                  className="ml-2.5 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 3.33337L12.6667 8.00004L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
