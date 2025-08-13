import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
import Navbar from "../components/Navbar";

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

  // Enhanced AnimatedHighlight that works with TypewriterText
  const AnimatedHighlight = ({ children, delay = 0 }) => {
    return (
      <motion.span
        className="relative inline-block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1, delay: delay + 0.5 }}
      >
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
      </motion.span>
    );
  };
  const features = [
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "GPA Calculator",
      description:
        "Track your grades and predict your GPA with scary accuracy. No more surprises!",
      color: "from-accent-500 to-accent-600",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Co-op Forum",
      description:
        "Share job experiences, tips, and survive the co-op hunt together.",
      color: "from-primary-600 to-accent-500",
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Course Scheduling",
      description:
        "Never double-book again! Our AI finds the perfect schedule that fits your life.",
      color: "from-primary-500 to-primary-600",
    },
  ];

  const funFacts = [
    { icon: <Coffee />, text: "Powered by 47% coffee, 53% determination" },
    { icon: <Brain />, text: "Built by students who've been there, done that" },
    {
      icon: <Star />,
      text: "Tested by procrastinators, approved by perfectionists",
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24"
        style={{ y, opacity }}
      >
        {/* Fireflies Animation */}
        <div className="absolute inset-0">
          {/* Fireflies */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary-500 rounded-full shadow-lg"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: `0 0 6px #456882, 0 0 12px #456882, 0 0 18px #456882`,
              }}
              animate={{
                x: [
                  0,
                  Math.random() * 200 - 100,
                  Math.random() * 150 - 75,
                  Math.random() * 100 - 50,
                  0,
                ],
                y: [
                  0,
                  Math.random() * 150 - 75,
                  Math.random() * 200 - 100,
                  Math.random() * 100 - 50,
                  0,
                ],
                scale: [0, 1, 0.8, 1.2, 0.6, 1, 0],
                opacity: [0, 0.8, 0.3, 1, 0.4, 0.9, 0],
              }}
              transition={{
                duration: 8 + Math.random() * 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 5,
                repeatDelay: Math.random() * 3,
              }}
            />
          ))}

          {/* Additional smaller fireflies */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`small-${i}`}
              className="absolute w-0.5 h-0.5 bg-primary-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: `0 0 4px #456882, 0 0 8px #456882`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50, Math.random() * 80 - 40, 0],
                y: [0, Math.random() * 100 - 50, Math.random() * 120 - 60, 0],
                opacity: [0, 0.6, 0.2, 0.8, 0],
                scale: [0, 0.8, 1.2, 0.6, 0],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 4,
                repeatDelay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-6xl mx-auto">
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
                Smart
              </motion.span>
              <motion.span
                className="text-neutral-800"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                Gryph
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
                  text="Because adulting is hard enough."
                  delay={3.5}
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
                className="bg-primary-500 text-white px-10 py-5 rounded-xl font-bold text-xl shadow-xl hover:bg-primary-600 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Button shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "200%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Start Your Journey</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-neutral-400" />
        </motion.div>
      </motion.section>

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

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group relative p-8 rounded-2xl elegant-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
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

                {/* Hover effect overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
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
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 md:left-1/2 transform md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-400 to-primary-200"></div>

            {[
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
                year: "December 2023",
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
                year: "November 2024",
                icon: "Calendar",
                color: "text-yellow-500",
                bgColor: "bg-yellow-50",
                borderColor: "border-yellow-200",
                description:
                  "Brijesh missed another 10% assignment. While he didn't drop the course this time, he took an L and thought 'there has to be a way to fix this issue, right?' The library's paper calendars seemed logical, but reading course outlines and adding deadlines manually felt like torture for engineering students.",
              },
              {
                year: "December 2024",
                icon: "Zap",
                color: "text-purple-500",
                bgColor: "bg-purple-50",
                borderColor: "border-purple-200",
                description:
                  "Brijesh decided to use LLMs to extract events from course outlines. Sounds simple, right? Wrong! Turns out LLMs don't know that ENGG*3380*0102 has lab sections on Tuesday, not Friday. He had to add web scraping to give the model context about actual course sections.",
              },
              {
                year: "January 2025",
                icon: "Users",
                color: "text-blue-500",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                description:
                  "Before his co-op, Brijesh showed the project to Mann. Mann was still drowning in Excel calculating grades across 3 grading schemes for CIS*3110, 2 for ENGG*3410, and more. They realized they had the backend and frontend skills to tackle all of these problems in one huge project together.",
              },
              {
                year: "August 2025",
                title: "The Final Piece",
                icon: "MessageCircle",
                color: "text-green-500",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
                description:
                  "After building the GPA calculator, Course Scheduler, and Assignment extractor, we realized students needed more: specific knowledge about co-op companies and experiences. The UofG subreddit wasn't co-op specific, so we added a beta co-op forum for anonymous feedback and community support.",
              },
              {
                year: "Today",
                title: "SmartGryph Lives",
                icon: "CheckCircle",
                color: "text-primary-500",
                bgColor: "bg-primary-50",
                borderColor: "border-primary-200",
                description:
                  "From personal academic struggles to a comprehensive student platform. SmartGryph is built by students who experienced these pain points firsthand, for students who deserve better tools than spreadsheets and paper calendars.",
                impact: "✨ Making student life easier, one feature at a time",
              },
            ].map((item, index) => {
              // Icon component mapping
              const iconMap = {
                AlertTriangle,
                BookOpen,
                Calendar,
                Zap,
                Users,
                MessageCircle,
                CheckCircle,
              };
              const IconComponent = iconMap[item.icon];

              return (
                <motion.div
                  key={index}
                  className={`relative flex items-start mb-12 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  {/* Timeline marker */}
                  <div className="absolute left-8 md:left-1/2 transform -translate-x-1/2 mt-2 w-4 h-4 bg-white rounded-full border-4 border-primary-400 z-10"></div>

                  {/* Content */}
                  <div
                    className={`ml-16 md:ml-0 md:w-5/12 ${
                      index % 2 === 0 ? "" : "md:text-right"
                    }`}
                  >
                    <motion.div
                      className={`elegant-card rounded-2xl p-6 ${item.bgColor} border-l-4 ${item.borderColor}`}
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className={`flex items-center mb-4 ${
                          index % 2 === 0 ? "" : "md:justify-end"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                            index % 2 === 0 ? "" : "md:mr-0 md:ml-3 md:order-2"
                          } ${item.bgColor.replace("50", "100")}`}
                        >
                          <IconComponent className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <div className={index % 2 === 0 ? "" : "md:order-1"}>
                          <p className="text-sm font-semibold text-primary-600 mb-1">
                            {item.year}
                          </p>
                          {item.title && (
                            <h3 className="text-lg font-bold text-neutral-800 font-display">
                              {item.title}
                            </h3>
                          )}
                        </div>
                      </div>

                      <p className="text-neutral-700 mb-4 leading-relaxed text-left">
                        {item.description}
                      </p>

                      {item.impact && (
                        <div
                          className={`inline-block px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium ${item.color}`}
                        >
                          {item.impact}
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      {/* Fun Facts Section */}
      <section className="py-20 px-4 bg-primary-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-display font-bold mb-12 text-neutral-800"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            The Real Talk
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {funFacts.map((fact, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center p-6 elegant-card rounded-xl"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                }}
              >
                <motion.div
                  className="text-primary-600 mb-4"
                  whileHover={{
                    scale: 1.2,
                    rotate: [0, -10, 10, 0],
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {React.cloneElement(fact.icon, { size: 48 })}
                </motion.div>
                <p className="text-neutral-700 font-medium text-center">
                  {fact.text}
                </p>
              </motion.div>
            ))}
          </div>
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
              Ready to Level Up?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who've already discovered the secret to
              academic success. Spoiler alert: it's not more coffee.
            </p>

            <motion.button
              onClick={handleStartJourney}
              className="bg-white text-primary-700 px-10 py-5 rounded-xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Button shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-200/30 to-transparent -skew-x-12"
                initial={{ x: "-100%" }}
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.6 }}
              />
              <span className="relative z-10 flex items-center space-x-2">
                <GraduationCap className="w-5 h-5" />
                <span>Get Started Free</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
