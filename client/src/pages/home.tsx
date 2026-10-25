import { useEffect } from "react";
import Navigation from "@/components/ui/navigation";
import Hero from "@/components/sections/hero";
import Services from "@/components/sections/services";
import Team from "@/components/sections/team";
import Contact from "@/components/sections/contact";
import Footer from "@/components/sections/footer";
import LoadingScreen from "@/components/animations/loading-screen";
import Counter from "@/components/ui/counter-animation";
import SectionTransition, { WaveTransition, DiagonalTransition } from "@/components/animations/section-transition";
import ParallaxSection from "@/components/animations/parallax-section";
import ScrollReveal, { RevealOnScroll } from "@/components/animations/scroll-reveal";
import ProjectInsights from "@/components/sections/project-insights";
import Portfolio from "@/components/sections/portfolio";

export default function Home() {
  useEffect(() => {
    document.title = "CRUD5th - エンジニアチーム | 受託開発・自社サービス開発・DX/ITコンサル";
    
    // Add meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'CRUD5thは受託開発、自社サービス開発、DX・ITコンサルティングを提供するエンジニアチームです。革新的なソリューションでビジネスの成長をサポートします。');

    // Add Open Graph tags
    const ogTags = [
      { property: 'og:title', content: 'CRUD5th - エンジニアチーム' },
      { property: 'og:description', content: 'CRUD5thは受託開発、自社サービス開発、DX・ITコンサルティングを提供するエンジニアチームです。' },
      { property: 'og:type', content: 'website' },
    ];

    ogTags.forEach(tag => {
      let existing = document.querySelector(`meta[property="${tag.property}"]`);
      if (!existing) {
        existing = document.createElement('meta');
        existing.setAttribute('property', tag.property);
        document.head.appendChild(existing);
      }
      existing.setAttribute('content', tag.content);
    });
  }, []);

  useEffect(() => {
    if (window.location.pathname !== "/contact" && window.location.hash !== "#contact") return;
    // The app preloader mounts Home after the browser's initial anchor lookup.
    const frameId = requestAnimationFrame(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <LoadingScreen />
      <Navigation />
      <main>
        <Hero />
        
        {/* Smooth transition from hero to services */}
        <WaveTransition direction="down" color="hsl(217 20% 8%)" />
        
        <Services />
        
        {/* Enhanced Statistics Section with Parallax */}
        <ParallaxSection speed={0.5} className="relative">
          <section className="py-24 bg-gradient-to-br from-secondary/40 via-muted/20 to-background relative overflow-hidden" data-testid="statistics-section">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
            </div>
            
            <div className="max-w-7xl mx-auto px-6 relative">
              <RevealOnScroll className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">実績</h2>
                <p className="text-xl text-muted-foreground">数字で見る私たちの成果</p>
              </RevealOnScroll>
              
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <ScrollReveal direction="up" delay={0} className="glass-card p-6 rounded-xl">
                  <div className="text-5xl font-bold gradient-text mb-2" data-testid="stat-projects">
                    <Counter target={50} />
                  </div>
                  <div className="text-muted-foreground">プロジェクト完了</div>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={100} className="glass-card p-6 rounded-xl">
                  <div className="text-5xl font-bold gradient-text mb-2" data-testid="stat-members">
                    <Counter target={3} />
                  </div>
                  <div className="text-muted-foreground">チームメンバー</div>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={200} className="glass-card p-6 rounded-xl">
                  <div className="text-5xl font-bold gradient-text mb-2" data-testid="stat-satisfaction">
                    <Counter target={98} suffix="%" />
                  </div>
                  <div className="text-muted-foreground">クライアント満足度</div>
                </ScrollReveal>
                <ScrollReveal direction="up" delay={300} className="glass-card p-6 rounded-xl">
                  <div className="text-5xl font-bold gradient-text mb-2" data-testid="stat-support">
                    <Counter target={24} />
                  </div>
                  <div className="text-muted-foreground">サポート時間/日</div>
                </ScrollReveal>
              </div>
            </div>
          </section>
        </ParallaxSection>

        {/* Smooth transition to insights section */}
        <WaveTransition direction="up" color="hsl(217 22% 10%)" />
        
        <SectionTransition variant="reveal">
          <ProjectInsights />
        </SectionTransition>

        {/* Wave transition to portfolio section */}
        <WaveTransition direction="down" color="hsl(217 22% 8%)" />
        
        <SectionTransition variant="scale">
          <Portfolio />
        </SectionTransition>

        {/* Diagonal transition to team section */}
        <DiagonalTransition direction="right" color="hsl(217 20% 8%)" />
        
        <SectionTransition variant="fade">
          <Team />
        </SectionTransition>

        {/* Wave transition to contact section */}
        <WaveTransition direction="up" color="hsl(217 25% 12%)" />
        
        <SectionTransition variant="scale">
          <Contact />
        </SectionTransition>
      </main>
      
      {/* Smooth transition to footer */}
      <DiagonalTransition direction="left" color="hsl(217 20% 15%)" />
      <Footer />
    </div>
  );
}
