"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const HIDE_LAYOUT_PATHS = ["/deri", "/user"];

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname();
  const shouldHideLayout = HIDE_LAYOUT_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  return (
    <>
      {!shouldHideLayout && <Nav />}
      {children}
      {!shouldHideLayout && <Footer />}
    </>
  );
};

export default LayoutWrapper;
