"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const switchRef = useRef<HTMLButtonElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft } = scrollRef.current;
    const cardWidth = scrollRef.current.scrollWidth / plans.length;
    const computedIndex = Math.round(scrollLeft / cardWidth);
    const finalIndex = Math.max(0, Math.min(plans.length - 1, computedIndex));
    setActiveSlide(finalIndex);
  };

  const handleDotClick = (idx: number) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.scrollWidth / plans.length;
    scrollRef.current.scrollTo({
      left: idx * cardWidth,
      behavior: 'smooth'
    });
    setActiveSlide(idx);
  };

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: [
          "hsl(var(--primary))",
          "hsl(var(--accent))",
          "hsl(var(--secondary))",
          "hsl(var(--muted))",
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="w-full py-10 lg:py-20 px-4 md:px-6">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-850">
          {title}
        </h2>
        <p className="text-zinc-500 text-sm md:text-lg whitespace-pre-line max-w-2xl mx-auto font-semibold">
          {description}
        </p>
      </div>

      <div className="flex justify-center items-center mb-10">
        <label className="relative inline-flex items-center cursor-pointer">
          <Label>
            <Switch
              ref={switchRef as any}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative"
            />
          </Label>
        </label>
        <span className="ml-2.5 font-bold text-sm text-zinc-700">
          Annual billing <span className="text-primary font-extrabold">(Save 20%)</span>
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex lg:grid lg:grid-cols-3 gap-8 lg:gap-4 max-w-6xl mx-auto items-stretch overflow-x-auto lg:overflow-x-visible pb-6 lg:pb-0 snap-x snap-mandatory scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0"
      >
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 1 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -20 : 0,
                    opacity: 1,
                    x: index === 2 ? -30 : index === 0 ? 30 : 0,
                    scale: index === 0 || index === 2 ? 0.94 : 1.0,
                  }
                : {}
            }
            viewport={{ once: true }}
            transition={{
              duration: 1.2,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.2,
              opacity: { duration: 0.4 },
            }}
            className={cn(
              `w-[85vw] sm:w-[380px] lg:w-auto flex-shrink-0 snap-start snap-always rounded-2xl border-[1px] p-6 bg-background text-center lg:flex lg:flex-col lg:justify-center relative transition-all duration-300`,
              plan.isPopular ? "border-primary border-2 shadow-premium" : "border-zinc-200/85 hover:border-zinc-300 shadow-sm",
              "flex flex-col",
              !plan.isPopular && "lg:mt-5",
              index === 0 || index === 2
                ? "z-0 lg:transform lg:translate-x-0 lg:translate-y-0 lg:-translate-z-[50px] lg:rotate-y-[10deg]"
                : "z-10",
              index === 0 && "lg:origin-right",
              index === 2 && "lg:origin-left"
            )}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-primary py-1 px-3 rounded-bl-xl rounded-tr-xl flex items-center shadow-sm">
                <Star className="text-primary-foreground h-3.5 w-3.5 fill-current" />
                <span className="text-primary-foreground ml-1 text-xs font-bold uppercase tracking-wider">
                  Popular
                </span>
              </div>
            )}
            <div className="flex-1 flex flex-col">
              <p className="text-xs md:text-sm font-bold text-zinc-400 uppercase tracking-wider">
                {plan.name}
              </p>
              <div className="mt-6 flex items-center justify-center gap-x-2">
                <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-855">
                  <NumberFlow
                    value={
                      isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)
                    }
                    format={{
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                    formatter={(value) => `$${value}`}
                    transformTiming={{
                      duration: 500,
                      easing: "ease-out",
                    }}
                    willChange
                    className="font-variant-numeric: tabular-nums"
                  />
                </span>
                {plan.period !== "Next 3 months" && (
                  <span className="text-xs md:text-sm font-semibold leading-6 tracking-wide text-zinc-450">
                    / {plan.period}
                  </span>
                )}
              </div>

              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mt-1">
                {isMonthly ? "billed monthly" : "billed annually"}
              </p>

              <ul className="mt-6 gap-3 flex flex-col">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-zinc-600 font-medium">
                    <Check className="h-4.5 w-4.5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-left leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="w-full my-6 border-zinc-100" />

              <Link
                to={plan.href}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                  }),
                  "group relative w-full py-3.5 px-6 gap-2 overflow-hidden text-sm font-bold rounded-20 shadow-sm border border-zinc-200 hover:border-primary transition-all",
                  "transform-gpu ring-offset-current duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1 hover:bg-primary hover:text-primary-foreground",
                  plan.isPopular
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-zinc-800"
                )}
              >
                {plan.buttonText}
              </Link>
              <p className="mt-5 text-[11px] leading-relaxed text-zinc-450 font-semibold">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom Mobile Slider Progress Dots */}
      <div className="flex justify-center gap-2 mt-4 lg:hidden">
        {plans.map((_, idx) => (
          <button
            key={idx}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeSlide === idx ? 'w-6 bg-primary' : 'w-2 bg-zinc-200'
            }`}
            onClick={() => handleDotClick(idx)}
            aria-label={`Go to package ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
