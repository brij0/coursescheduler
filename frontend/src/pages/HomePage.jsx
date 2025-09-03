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

// Add this hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// Detect reduced motion preference
const usePrefersReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);
    
    const handleChange = () => setPrefersReduced(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReduced;
};

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
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // In GlobalBackground, AnimatedLines, etc., use the prefersReducedMotion value:
  const simpleAnimations = isMobile || prefersReducedMotion;

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
      icon: <Calendar className="w-8 h-8" />,
      title: "Assignment Calendar",
      description:
        "Export your course schedule to your favorite calendar app.",
      color: "from-green-500 to-green-600",
      path: "/schedule",
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Scheduler",
      description:
        "Find conflict-free schedules in seconds. Keep your Fridays open.",
      color: "from-primary-500 to-primary-600",
      path: "/conflict-free-schedule",
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
    // Skip complex background on mobile
    if (isMobile) {
      return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-[#f7fafc]">
          <div className="absolute -top-40 -left-32 w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(70,120,150,0.12),transparent_70%)]" />
          <div className="absolute bottom-[-25%] left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(80,130,160,0.08),transparent_70%)]" />
        </div>
      );
    }
    
    // Full version for desktop
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#f7fafc]">
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
            willChange: "transform",
            contain: "paint",
          }}
          animate={{ backgroundPosition: ["0% 0%", "120% 100%", "0% 0%"] }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        />
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
    
    // Even more simplified config for mobile
    const springConfig = isMobile 
      ? { stiffness: 50, damping: 30, mass: 0.2 } // Much lighter spring for mobile
      : { stiffness: 110, damping: 25, mass: 0.25 };
    
    // Use a regular transform on mobile without springs for better performance
    const segmentProgress = isMobile 
      ? useTransform(scrollYProgress, [start, end], [0, 1], { clamp: true })
      : useTransform(useSpring(scrollYProgress, springConfig), [start, end], [0, 1], { clamp: true });

    const iconMap = { AlertTriangle, BookOpen, Calendar, Zap, Users, MessageCircle, CheckCircle };
    const IconComponent = iconMap[event.icon];

    // Even simpler animations for mobile
    let opacity, scale, y, rotate;

    if (isMobile) {
      // Use simpler transforms without springs for mobile
      opacity = useTransform(
        segmentProgress,
        [0, 0.2, 0.8, 1],
        [0, 1, 1, 0]
      );
      
      // On mobile, only do minimal Y translation, no scaling or rotation
      scale = 1; // No scale animation on mobile
      y = useTransform(segmentProgress, [0, 0.5, 1], [20, 0, -20]);
      rotate = 0; // No rotation on mobile
    } else {
      // Keep existing desktop animations
      const extendedFadePoint = Math.min(1, end + segment * 0.3);
      opacity = index === 0
        ? useTransform(scrollYProgress, [0, segment * 0.05, end, extendedFadePoint], [1, 1, 1, 0])
        : useTransform(segmentProgress, [0, 0.15, 0.55, 0.85, 1], [0, 1, 1, 0.6, 0]);
      scale = useTransform(segmentProgress, [0, 0.15, 0.5, 1], [0.9, 1, 1, 0.95]);
      y = useTransform(segmentProgress, [0, 0.2, 0.5, 1], [60, 0, 0, -50]);
      rotate = useTransform(segmentProgress, [0, 0.5, 1], [2.5, 0, -2]);
    }

    return (
      <motion.div
        style={{
          opacity,
          scale,
          y,
          rotate,
          pointerEvents: "none",
          willChange: isMobile ? "opacity, transform" : "transform, opacity", 
          transformStyle: isMobile ? "flat" : "preserve-3d", // Use flat transform on mobile
          contain: "layout paint size",
        }}
        className="absolute inset-0 flex items-center justify-center"
        // Use CSS transition for smoother performance on mobile
        transition={isMobile ? { duration: 0.1 } : undefined}
      >
        <div className={`relative w-full ${isMobile ? 'max-w-[85%]' : 'max-w-[48rem]'} px-3 sm:px-0 pointer-events-auto`}>
          <div className="relative group">
            {/* Card content */}
            <div className={`relative rounded-[28px] p-[1.5px] bg-gradient-to-br ${
              isMobile ? 'from-white/60 via-primary-100/20 to-transparent' : 'from-white/70 via-primary-100/30 to-primary-300/10'
            }`}>
              {/* Even more simplified card for mobile */}
              <div className={`relative rounded-[26px] ${
                isMobile ? 'bg-white/90' : 'bg-white/82 backdrop-blur-xl'
              } ${isMobile ? 'p-4' : 'p-10'} shadow-[0_6px_34px_-10px_rgba(60,100,130,0.22)] overflow-hidden`}>
                
                {/* Year & Icon Row - further simplified for mobile */}
                <div className={`flex items-start ${isMobile ? 'mb-3' : 'mb-8'}`}>
                  {/* Static non-animated icon on mobile */}
                  <div
                    className={`${isMobile ? 'w-12 h-12' : 'w-20 h-20'} rounded-3xl flex-shrink-0 flex items-center justify-center ${isMobile ? 'mr-3' : 'mr-7'} ${event.bgColor} relative`}
                  >
                    <IconComponent className={`${isMobile ? 'w-6 h-6' : 'w-10 h-10'} ${event.color}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-[12px] font-semibold tracking-wide bg-white/85 border border-primary-200/70 text-neutral-700 shadow-sm">
                        {event.year}
                      </span>
                    </div>
                    <h3 className={`${isMobile ? 'mt-2 text-lg' : 'mt-4 text-[2.15rem]'} leading-tight font-display font-bold text-neutral-800 relative`}>
                      {event.title || `Chapter ${index + 1}`}
                      <span className={`block ${isMobile ? 'mt-1.5 h-[2px] w-10' : 'mt-3 h-[3.5px] w-16'} rounded-full bg-gradient-to-r from-primary-500 to-primary-300`} />
                    </h3>
                  </div>
                </div>

                {/* Description - even shorter on mobile */}
                <p className={`${isMobile ? 'text-sm' : 'text-[1.12rem]'} text-neutral-700 leading-relaxed ${isMobile ? 'mb-4' : 'mb-10'}`}>
                  {isMobile && event.description.length > 100
                    ? `${event.description.substring(0, 100)}...`
                    : event.description}
                </p>

                {/* Simpler indicator dots for mobile */}
                <div className={`mt-3 flex items-center justify-center ${isMobile ? 'gap-1' : 'gap-2.5'}`}>
                  {Array.from({ length: total }).map((_, i) => (
                    <span
                      key={i}
                      className={`${isMobile ? 'h-1.5 w-1.5' : 'h-3 w-3'} rounded-full ${
                        i === index
                          ? "bg-primary-500"
                          : "bg-neutral-300/70"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Update TimelinePinned for better mobile scrolling
  const TimelinePinned = () => {
    const pinRef = useRef(null);
    
    // Smaller pinned section on mobile but still enough to display all cards
    const sectionHeight = isMobile ? 
      `${timelineEvents.length * 70}vh` : // Taller on mobile to ensure all cards are viewable
      `${timelineEvents.length * 100}vh`; 
    
    // Adjust scroll trigger for better mobile performance
    const startOffset = isMobile ? "start 90%" : "start 75%";
    const { scrollYProgress } = useScroll({
      target: pinRef,
      offset: [startOffset, "end end"],
    });

    return (
      <div
        ref={pinRef}
        style={{ height: sectionHeight }}
        className="relative"
      >
        <div className="sticky top-24 h-[calc(100vh-6rem)] overflow-hidden">
          {!isMobile && <TimelineSceneBackground />}
          
          {/* Simpler timeline line on mobile */}
          {isMobile ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[1px] h-[60%] bg-primary-400/40" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-px h-[70%] bg-gradient-to-b from-transparent via-primary-400/65 to-transparent drop-shadow-[0_0_5px_rgba(69,104,130,0.4)]" />
            </div>
          )}
          
          {/* Show ALL timeline cards, not just the first 3 */}
          {timelineEvents.map((evt, i) => (
            <TimelineCard
              key={i}
              event={evt}
              index={i}
              total={timelineEvents.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
          
          {/* Add instruction for mobile */}
          {isMobile && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/80 rounded-full text-sm text-neutral-600 shadow-sm border border-primary-100">
              Scroll to see more.
            </div>
          )}
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
                className="group relative p-8 rounded-2xl elegant-card cursor-pointer overflow-hidden"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(feature.path)}
              >
                {/* Instant background color change on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out -z-10" />

                {/* Elegant bottom border that appears instantly */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out" />
                
                {/* Shadow transition */}
                <div className="absolute inset-0 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-200" />

                {/* Icon with quick elegant animation */}
                <div className="p-4 rounded-xl bg-primary-500 text-white mb-6 inline-block transform transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg">
                  {feature.icon}
                </div>

                <h3 className="text-2xl font-bold mb-4 text-neutral-800 font-display group-hover:text-primary-600 transition-colors duration-150">
                  {feature.title}
                </h3>

                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
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
