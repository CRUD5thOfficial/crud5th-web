import { motion } from "framer-motion";
import ScrollReveal, { RevealOnScroll, SlideInLeft } from "@/components/animations/scroll-reveal";
import { AnimatedUnderline, AnimatedArrow } from "@/components/animations/svg-path-animation";
import { ArrowRight, Code, Rocket, TrendingUp } from "lucide-react";
import { kotoportContent } from "@/pages/kotoport-content";

const services = [
  {
    icon: Code,
    title: "受託開発",
    description: "フリーランス同士の連携により、高品質なWebアプリケーション・システム開発をスピーディーに提供します。",
    features: [
      "フロントエンド開発",
      "バックエンド開発", 
      "データベース設計",
      "API開発・統合"
    ],
    gradient: "from-blue-500/20 to-cyan-500/20"
  },
  {
    icon: Rocket,
    title: "自社サービス開発",
    description: "市場のニーズを捉えた革新的なWebサービスの企画・開発・運用まで一貫してサポートします。",
    features: [
      "サービス企画・設計",
      "MVP開発",
      "スケーリング支援",
      "マーケティング連携"
    ],
    gradient: "from-purple-500/20 to-pink-500/20"
  },
  {
    icon: TrendingUp,
    title: "DX・ITコンサル",
    description: "企業のデジタル変革をテクノロジーの視点から戦略的にサポートし、業務効率化を実現します。",
    features: [
      "DX戦略立案",
      "システム選定・導入",
      "業務プロセス改善",
      "技術教育・研修"
    ],
    gradient: "from-green-500/20 to-emerald-500/20"
  }
];

// Enhanced 3D Service Card Component
function ServiceCard({ service, index }: { service: typeof services[0], index: number }) {

  return (
    <ScrollReveal 
      direction="up" 
      delay={index * 200} 
      className="h-full"
    >
      <motion.div
        className="service-card bg-secondary/50 backdrop-blur-sm border border-border rounded-xl p-8 h-full group cursor-pointer"
        data-testid={`service-card-${index}`}
        whileHover={{
          scale: 1.02,
          rotateY: 5,
          rotateX: 5,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          transformStyle: "preserve-3d",
          perspective: 1000,
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          willChange: 'transform'
        }}
      >
        <motion.div 
          className={`w-full h-48 bg-gradient-to-br ${service.gradient} rounded-lg mb-6 flex items-center justify-center relative overflow-hidden`}
          data-testid={`service-visual-${index}`}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100"
            transition={{ duration: 0.3 }}
          />
          <motion.div
            whileHover={{ 
              scale: 1.1,
              rotate: 5
            }}
            transition={{ duration: 0.2 }}
          >
            <service.icon className="w-16 h-16 text-primary/80 relative z-10" />
          </motion.div>
          
          {/* Animated arrow that appears on hover */}
          <motion.div
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100"
            initial={{ x: 20, opacity: 0 }}
            whileHover={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatedArrow className="w-6 h-6" delay={0} direction="right" />
          </motion.div>
        </motion.div>
        
        <motion.h3 
          className="text-xl font-semibold mb-3 text-foreground relative" 
          data-testid={`service-title-${index}`}
          whileHover={{ x: 3 }}
          transition={{ duration: 0.2 }}
        >
          {service.title}
          <AnimatedUnderline className="absolute -bottom-1 left-0 w-0 group-hover:w-full transition-all duration-500" delay={100} width={120} />
        </motion.h3>
        
        <motion.p 
          className="text-sm text-muted-foreground mb-5 leading-relaxed" 
          data-testid={`service-description-${index}`}
          whileHover={{ opacity: 0.8 }}
        >
          {service.description}
        </motion.p>
        
        <div className="space-y-1.5 text-xs text-muted-foreground" data-testid={`service-features-${index}`}>
          {service.features.map((feature, featureIndex) => (
            <motion.div 
              key={featureIndex}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: featureIndex * 0.1 }}
              whileHover={{ x: 3, color: "hsl(193 100% 60%)" }}
              className="transition-colors duration-200 flex items-center"
            >
              <span className="w-1 h-1 bg-primary rounded-full mr-2 flex-shrink-0"></span>
              {feature}
            </motion.div>
          ))}
        </div>
        
        {/* Glass morphism overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </ScrollReveal>
  );
}

export default function Services() {
  return (
    <section id="services" className="py-24 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 relative">
        <RevealOnScroll className="text-center mb-16" data-testid="services-header">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text relative">
            サービス
            <AnimatedUnderline className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24" delay={800} />
          </h2>
          <SlideInLeft delay={400}>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              私たちが提供する技術サービスで、あなたのビジネスを次のレベルへ導きます
            </p>
          </SlideInLeft>
        </RevealOnScroll>
        
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </div>
        <a
          href={kotoportContent.route}
          className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border pt-6 text-foreground group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span>
            <span className="block text-xs text-muted-foreground mb-1">{kotoportContent.homeEntry.label}</span>
            <strong className="block text-lg font-semibold">{kotoportContent.homeEntry.title}</strong>
            <span className="block text-sm text-muted-foreground mt-1">{kotoportContent.homeEntry.description}</span>
          </span>
          <span className="inline-flex min-h-11 items-center gap-3 text-sm text-primary group-hover:underline">
            {kotoportContent.homeEntry.link}<ArrowRight className="w-5 h-5" aria-hidden="true" />
          </span>
        </a>
      </div>
    </section>
  );
}