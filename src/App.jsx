import { Suspense, lazy, useEffect, useState, useRef } from "react";
import Navbar from "./game/sections/Navbar";

const BookPage = lazy(() => import("./book/BookPage").then((module) => ({ default: module.BookPage })));
const TheoryPage = lazy(() => import("./game/TheoryPage").then((module) => ({ default: module.TheoryPage })));
const AIUsagePage = lazy(() => import("./ai-usage/AIUsagePage").then((module) => ({ default: module.AIUsagePage })));
const MuseumPage = lazy(() => import("./museum/MuseumPage").then((module) => ({ default: module.MuseumPage })));

const TABS = [
  { id: "intro", label: "Mở Đầu" },
  { id: "book", label: "Tạp chí" },
  { id: "museum", label: "Bảo tàng" },
  { id: "ai", label: "AI Usage" },
];

function getActiveTab() {
  const hash = window.location.hash.replace("#", "");
  const path = window.location.pathname.replace("/", "");
  const from = TABS.find(t => t.id === hash || t.id === path);
  return from ? from.id : "intro";
}

/** Premium loading spinner component */
function PremiumLoader() {
  return (
    <div className="premium-loader">
      <div className="loader-rings">
        <div className="ring" />
        <div className="ring" />
        <div className="ring" />
        <div className="loader-center-dot" />
      </div>
      <div className="loader-text">Đang tải</div>
      <div className="loader-bar">
        <div className="loader-bar-fill" />
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(getActiveTab);
  const [displayedTab, setDisplayedTab] = useState(getActiveTab);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasVisitedBook, setHasVisitedBook] = useState(false);
  const transitionTimer = useRef(null);

  // React to browser back/forward and hash changes
  useEffect(() => {
    const onNav = () => {
      const newTab = getActiveTab();
      setActiveTab(newTab);
      setIsTransitioning(true);
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      transitionTimer.current = setTimeout(() => {
        setDisplayedTab(newTab);
        setIsTransitioning(false);
      }, 250);
    };
    window.addEventListener("hashchange", onNav);
    window.addEventListener("popstate", onNav);
    return () => {
      window.removeEventListener("hashchange", onNav);
      window.removeEventListener("popstate", onNav);
    };
  }, []);

  const handleTabChange = (id) => {
    if (id === activeTab && !isTransitioning) return;
    
    // Start exit transition
    setActiveTab(id);
    setIsTransitioning(true);
    window.location.hash = id;

    // After exit animation, swap content
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      setDisplayedTab(id);
      setIsTransitioning(false);
    }, 250); // matches tabFadeOut duration
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
      {/* Tab Content with Transition */}
      <div
        key={displayedTab}
        className={isTransitioning ? "tab-transition-exit" : "tab-transition-enter"}
        style={{ width: "100%", minHeight: "100vh" }}
      >
        <Suspense fallback={<PremiumLoader />}>
          {displayedTab === "intro" && <TheoryPage />}
          {displayedTab === "book" && <BookPage skipIntro={hasVisitedBook} onIntroFinish={() => setHasVisitedBook(true)} />}
          {displayedTab === "museum" && <MuseumPage />}
          {displayedTab === "ai" && <AIUsagePage />}
        </Suspense>
      </div>
    </div>
  );
}

export default App;
