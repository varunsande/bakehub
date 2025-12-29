import { FaInstagram, FaFacebookF, FaTwitter, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-primary-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
          {/* Left: Logo & Description */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="BakeHub Logo" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-white/80 text-base max-w-xs mb-6">
              Crafting sweet moments with premium ingredients and passion since 2010. Every bite tells a story.
            </p>
            <div className="flex gap-4">
              <a href="#" className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-white/30 transition" aria-label="Instagram"><FaInstagram className="w-5 h-5" /></a>
              <a href="#" className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-white/30 transition" aria-label="Facebook"><FaFacebookF className="w-5 h-5" /></a>
              <a href="#" className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-white/30 transition" aria-label="Twitter"><FaTwitter className="w-5 h-5" /></a>
            </div>
          </div>
          {/* Center: Links */}
          <div className="flex flex-col gap-2 mt-8 md:mt-0">
            <a href="#" className="hover:underline">Our Menu</a>
            <a href="#" className="hover:underline">Our Story</a>
            <a href="#" className="hover:underline">Track Order</a>
            <a href="#" className="hover:underline">Contact Us</a>
          </div>
          {/* Right: Contact Info */}
          <div className="flex flex-col gap-3 mt-8 md:mt-0">
            <div className="flex items-center gap-2"><FaMapMarkerAlt className="w-5 h-5" /> <span>GVMG+PGF, Santhi Nagar, Buchireddypalem,<br/>Buchireddipalem, Andhra Pradesh 524305</span></div>
            <div className="flex items-center gap-2"><FaPhoneAlt className="w-5 h-5" /> <span>6301818034</span></div>
            <div className="flex items-center gap-2"><FaEnvelope className="w-5 h-5" /> <span>varunsandeshtalluru@gmail.com</span></div>
          </div>
        </div>
        <hr className="my-8 border-white/20" />
        <div className="text-center text-white/70 text-sm">
          &copy; Bakehub Bakery. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

