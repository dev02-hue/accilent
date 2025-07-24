"use client";

import {
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
  FaFacebookF,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#003322] text-white pt-16 pb-8 px-6 md:px-12 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-white/10 pb-10">
        {/* Logo & Description */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-lime-500">Accilent</h2>
          <p className="text-sm leading-relaxed text-gray-200">
            We are an international financial company engaged in investment
            activities, which are related to trading on financial markets and
            cryptocurrency exchanges performed by qualified professional
            traders. Alpha Capital Limited is registered and located at 27
            Frankley Road, New Plymouth Central, New Zealand.
          </p>

          {/* Socials */}
          <div className="flex space-x-4 pt-4">
            <a href="#" className="p-2 rounded-full bg-[#00271D] hover:bg-lime-500 hover:text-black transition">
              <FaInstagram size={18} />
            </a>
            <a href="#" className="p-2 rounded-full bg-[#00271D] hover:bg-lime-500 hover:text-black transition">
              <FaLinkedinIn size={18} />
            </a>
            <a href="#" className="p-2 rounded-full bg-[#00271D] hover:bg-lime-500 hover:text-black transition">
              <FaTwitter size={18} />
            </a>
            <a href="#" className="p-2 rounded-full bg-[#00271D] hover:bg-lime-500 hover:text-black transition">
              <FaFacebookF size={18} />
            </a>
          </div>
        </div>

        {/* Useful Links */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Useful Links</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="#">Software Corner</a></li>
            <li><a href="#">Application Center</a></li>
            <li><a href="#">Research Section</a></li>
            <li><a href="#">Developing Corner</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Contact</h4>
          <ul className="space-y-4 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <FaPhoneAlt className="text-lime-400" />
              <span>+447552536736</span>
            </li>
            <li className="flex items-center gap-2">
              <FaEnvelope className="text-lime-400" />
              <span>Accilents@gmail.com</span>
            </li>
            <li className="flex items-start gap-2">
              <FaMapMarkerAlt className="text-lime-400 mt-1" />
              <span>
                27 Frankley Road<br />
                New Plymouth Central,<br />
                New Zealand
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="text-xs text-gray-400 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© Accilent Finance Limited 2020 | All Rights Reserved</p>
        <div className="flex gap-6">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Sitemap</a>
          <a href="#">Help</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
