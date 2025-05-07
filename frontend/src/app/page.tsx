"use client";

import Footer from "@/components/footer";
import axios from "axios";
import React, { useState } from "react";

const features = [
  {
    icon: "fas fa-rocket",
    title: "Instant Deployment",
    desc: "Spin up your dream server in the blink of an eye.",
  },
  {
    icon: "fas fa-heart",
    title: "Gamer-Loving Security",
    desc: "DDoS protection, backups, and peace of mind baked in.",
  },
  {
    icon: "fas fa-wand-magic-sparkles",
    title: "Modding Magic",
    desc: "Install what you love — Forge, Fabric, or something custom.",
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/waitlist`,
        { email }
      );

      if (res.status === 201) {
        setSubmitted(true);
        setErrorMessage(null);
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Something went wrong. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <header className="relative flex h-screen flex-col justify-center items-center text-center px-6">
        <div className="absolute inset-0 -z-10 bg-[url('/img/minecraft.jpg')] bg-cover bg-center opacity-20 blur-sm" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl">
          Hosting with{" "}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent">
            personality
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-gray-300 italic">
          Say goodbye to boring servers — Orvex is built to be lovable.
        </p>
      </header>

      <section className="px-6 py-24 text-center">
        <h2 className="text-4xl font-bold mb-4">
          Why you'll{" "}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent">
            fall for Orvex
          </span>
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-12">
          All the tech muscle you need, wrapped in vibes you'll actually enjoy.
        </p>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-md shadow-lg hover:scale-[1.03] transition-transform text-left"
            >
              <div className="mb-4 flex items-center justify-center h-12 w-12 rounded-full bg-violet-500/20">
                <i className={`${icon} text-xl text-violet-300`} />
              </div>
              <h3 className="text-xl font-semibold mb-1">{title}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-violet-400 via-indigo-600 to-indigo-800 py-24 px-4 text-center">
        <h2 className="text-4xl font-extrabold mb-3 drop-shadow-sm">
          This is just the beginning...
        </h2>
        <p className="text-white/80 mb-8 text-lg max-w-xl mx-auto">
          Be the first to meet Orvex — where innovation meets excellence.
        </p>

        {submitted ? (
          <p className="text-green-300 text-lg font-medium">
            You're in. We’ll save you a seat 💌
          </p>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-xl mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full sm:w-auto flex-1 px-5 py-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white shadow-md"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-3 rounded-lg font-semibold transition shadow-md flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin text-lg" />
                ) : (
                  "Join the Waitlist"
                )}
              </button>
            </form>

            {errorMessage && (
              <p className="mt-4 text-red-400 text-sm font-medium">
                {errorMessage}
              </p>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
