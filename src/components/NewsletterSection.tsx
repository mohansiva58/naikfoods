import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function NewsletterSection() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    toast.success('Successfully subscribed ✨');

    setEmail('');
  };

  return (
    <section
      className="
        relative
        overflow-hidden
        bg-white
        py-14
        sm:py-16
      "
    >
      {/* TOP BORDER */}
      <div className="absolute top-0 left-0 h-[1px] w-full bg-neutral-200" />

      {/* BACKGROUND GRADIENT */}
      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.03),transparent_30%)]
        "
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="
            mx-auto
            max-w-3xl
            rounded-[36px]
            border
            border-neutral-200
            bg-neutral-50
            px-6
            py-10
            text-center
            shadow-[0_10px_40px_rgba(0,0,0,0.03)]
            sm:px-10
            sm:py-12
          "
        >
          {/* ICON */}

          <div
            className="
              mx-auto
              mb-5
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-black
              text-white
            "
          >
            <Mail size={24} />
          </div>

          {/* SMALL TITLE */}

          <p
            className="
              mb-3
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.3em]
              text-neutral-400
            "
          >
            Stay Updated
          </p>

          {/* HEADING */}

          <h2
            className="
              mx-auto
              max-w-2xl
              text-3xl
              font-semibold
              leading-tight
              tracking-tight
              text-black
              sm:text-4xl
            "
          >
            Join the Naikfoods Family
          </h2>

          {/* DESCRIPTION */}

          <p
            className="
              mx-auto
              mt-4
              max-w-xl
              text-sm
              leading-7
              text-neutral-500
              sm:text-base
            "
          >
            Get early access to new collections,
            exclusive offers, and   fashion
            updates directly in your inbox.
          </p>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="
              mx-auto
              mt-8
              flex
              max-w-xl
              flex-col
              gap-3
              sm:flex-row
            "
          >
            {/* INPUT */}

            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email address"
                required
                className="
                  h-14
                  w-full
                  rounded-full
                  border
                  border-neutral-200
                  bg-white
                  px-6
                  pr-12
                  text-sm
                  text-black
                  placeholder:text-neutral-400
                  outline-none
                  transition-all
                  focus:border-black
                "
              />

              <Mail
                size={18}
                className="
                  absolute
                  right-5
                  top-1/2
                  -translate-y-1/2
                  text-neutral-400
                "
              />
            </div>

            {/* BUTTON */}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="
                flex
                h-14
                items-center
                justify-center
                gap-2
                rounded-full
                bg-black
                px-8
                text-sm
                font-semibold
                text-white
                transition-all
                hover:opacity-90
              "
            >
              Subscribe
              <ArrowRight size={18} />
            </motion.button>
          </form>

          {/* FOOTER TEXT */}

          <p
            className="
              mt-5
              text-xs
              leading-6
              text-neutral-400
            "
          >
            No spam. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}