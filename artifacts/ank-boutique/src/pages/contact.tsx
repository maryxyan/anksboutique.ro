import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Instagram, MessageCircle, Mail, MapPin, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production this would POST to an email service
    setSubmitted(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-3xl lg:text-5xl font-serif mb-4">Get in Touch</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              We are always happy to hear from you. Reach out for styling advice, order inquiries, or just to say hello.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Methods */}
            <div className="space-y-8">
              <a
                href="https://wa.me/40700000000"
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-5 group p-6 border border-border hover:border-foreground transition-colors"
              >
                <div className="w-12 h-12 bg-[#25D366] text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">Chat with us directly for the fastest response. Available Mon–Sat, 10:00–18:00.</p>
                  <span className="text-sm border-b border-foreground pb-0.5 mt-3 inline-block group-hover:text-muted-foreground transition-colors uppercase tracking-widest text-xs font-medium">
                    Start Chat
                  </span>
                </div>
              </a>

              <a
                href="https://instagram.com/anksboutique"
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-5 group p-6 border border-border hover:border-foreground transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white flex items-center justify-center shrink-0">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Instagram</h3>
                  <p className="text-sm text-muted-foreground">Follow us for daily inspiration, behind-the-scenes, and new arrivals. DMs welcome.</p>
                  <span className="text-sm border-b border-foreground pb-0.5 mt-3 inline-block group-hover:text-muted-foreground transition-colors uppercase tracking-widest text-xs font-medium">
                    @anksboutique
                  </span>
                </div>
              </a>

              <div className="flex items-start gap-5 p-6 border border-border">
                <div className="w-12 h-12 bg-muted flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Email</h3>
                  <p className="text-sm text-muted-foreground">For orders, returns, and collaborations. We respond within 24 hours.</p>
                  <a href="mailto:contact@anksboutique.ro" className="text-sm border-b border-foreground pb-0.5 mt-3 inline-block uppercase tracking-widest text-xs font-medium">
                    contact@anksboutique.ro
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-5 p-6 border border-border">
                <div className="w-12 h-12 bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Location</h3>
                  <p className="text-sm text-muted-foreground">București, Romania</p>
                  <p className="text-xs text-muted-foreground mt-1">Online boutique — shipping nationwide</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-xl font-serif mb-8">Send a Message</h2>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-12 bg-muted text-center"
                >
                  <Check className="w-8 h-8 mx-auto mb-4 text-green-700" />
                  <h3 className="text-lg font-serif mb-2">Message Sent</h3>
                  <p className="text-sm text-muted-foreground">Thank you for reaching out. We will get back to you shortly.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                      className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                      placeholder="Maria Ionescu"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                      className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                      placeholder="maria@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      required
                      rows={6}
                      className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-12 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
