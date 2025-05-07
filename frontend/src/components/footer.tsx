"use client";

import React from "react";
import Link from "next/link";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-white py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start text-sm gap-8">
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
              Orvex
            </h2>
            <p className="text-gray-400 mt-2">Game servers with soul.</p>
          </div>

          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
            <Link
              href="/"
              target="_blank"
              className="text-white hover:text-violet-400 transition"
            >
              Home
            </Link>
            <Link
              href="https://discord.gg/J8Fk6HNTDk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-violet-400 transition"
            >
              Discord
            </Link>
            <span className="text-gray-500 opacity-30 cursor-not-allowed">
              Features
            </span>
            <span className="text-gray-500 opacity-30 cursor-not-allowed">
              Pricing
            </span>
            <span className="text-gray-500 opacity-30 cursor-not-allowed">
              About
            </span>
            <span className="text-gray-500 opacity-30 cursor-not-allowed">
              Careers
            </span>
          </nav>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
          © {year} Orvex. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
