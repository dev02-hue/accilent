import AboutUs from "../component/home/AboutUs";
import CryptoCurrencyTicker from "../component/home/CryptoCurrencyTicker";
import FAQSection from "../component/home/FAQSection";
import HeroSection from "../component/home/HeroSection";
import InvestmentCalculator from "../component/home/InvestmentCalculator";
import LetsDoGreat from "../component/home/LetsDoGreat";
import Newsletter from "../component/home/Newsletter";
import OurAdvantage from "../component/home/OurAdvantage";
import OurBusinesses from "../component/home/OurBusinesses";
import PricingSection from "../component/home/PricingSection";
import { TestimonialSection } from "../component/home/TestimonialSection";
import { WorkProcess } from "../component/home/WorkProcess";
import YouTubeVideo from "../component/home/YouTubeVideo";
import TeamSection from "../component/plan/TeamSection";
// import TranslateBody from "../component/user/TranslateBody";
 
 
export default function Home() {
  return (
     <div>
  {/* <TranslateBody /> */}
  <CryptoCurrencyTicker />
  <HeroSection /> 
  <OurAdvantage />
  <YouTubeVideo />
  <LetsDoGreat />
  <AboutUs />
  <PricingSection />
  <InvestmentCalculator />
  <WorkProcess />
  <TeamSection />
  <TestimonialSection />
  <FAQSection />
  <OurBusinesses />
  <Newsletter />
     </div>
  );
}
