import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function FAQItem({ faq, idx }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-zinc-200/85 rounded-20 overflow-hidden transition-all duration-300 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left text-zinc-800 font-bold text-sm md:text-base transition-colors hover:text-luxury-emerald"
      >
        <span>{faq.q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-zinc-450 hover:text-zinc-800"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 text-zinc-500 text-xs md:text-sm leading-relaxed border-t border-zinc-100 pt-3">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CarDetailingFAQAccordion({ faqs = [] }) {
  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => (
        <FAQItem key={idx} faq={faq} idx={idx} />
      ))}
    </div>
  );
}
