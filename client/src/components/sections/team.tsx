import { motion } from "framer-motion";
import ScrollReveal, { RevealOnScroll, SlideInLeft, ScaleIn } from "@/components/animations/scroll-reveal";
import { AnimatedUnderline } from "@/components/animations/svg-path-animation";
import { Github } from "lucide-react";
import { SiX } from "react-icons/si";

const teamMembers = [
  {
    name: "髙橋 綱弥",
    role: "Lead Engineer",
    description: "フルスタック開発とプロジェクトマネジメントを得意とし、チーム全体の技術戦略を牽引。",
    initials: "高綱",
    social: {
      twitter: "https://x.com/CRUD5th",
      github: "https://github.com/crudfifth"
    }
  },
  {
    name: "かえる",
    role: "Creative Engineer",
    description: "UI/UX デザインとフロントエンド開発のスペシャリスト。ユーザー体験の向上に情熱を注ぐ。",
    initials: "カ"
  }
];

// Enhanced 3D Team Card Component
function TeamCard({ member, index }: { member: typeof teamMembers[0], index: number }) {
  return (
    <ScaleIn delay={index * 200} className="h-full">
      <motion.div
        className="team-card bg-gradient-to-br from-secondary/80 to-muted/40 backdrop-blur-sm border border-border rounded-xl p-8 text-center h-full group cursor-pointer relative overflow-hidden"
        data-testid={`team-card-${index}`}
        whileHover={{
          scale: 1.02,
          rotateY: 8,
          z: 50
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          transformStyle: "preserve-3d",
          perspective: 1200
        }}
      >
        {/* Background glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 rounded-xl"
          transition={{ duration: 0.4 }}
        />
        
        {/* Avatar with enhanced 3D effect */}
        <motion.div 
          className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center relative z-10 overflow-hidden"
          data-testid={`team-avatar-${index}`}
          whileHover={{
            scale: 1.1,
            rotateZ: 5,
            boxShadow: "0 0 40px rgba(29, 151, 176, 0.4)"
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.span
            className="text-3xl font-bold text-primary"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {member.initials}
          </motion.span>
          
          {/* Floating particles around avatar on hover */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary/60 rounded-full"
                style={{
                  top: `${20 + Math.sin(i * Math.PI / 3) * 40}%`,
                  left: `${50 + Math.cos(i * Math.PI / 3) * 40}%`
                }}
                animate={{
                  y: [-5, -15, -5],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
              />
            ))}
          </motion.div>
        </motion.div>
        
        <motion.h3 
          className="text-xl font-semibold mb-2 text-foreground relative" 
          data-testid={`team-name-${index}`}
          whileHover={{ y: -1 }}
          transition={{ duration: 0.2 }}
        >
          {member.name}
          <AnimatedUnderline className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 group-hover:w-full transition-all duration-500" delay={200} width={80} />
        </motion.h3>
        
        <motion.p 
          className="text-primary/80 font-medium mb-3 text-sm" 
          data-testid={`team-role-${index}`}
          whileHover={{ color: "hsl(193 100% 70%)" }}
          transition={{ duration: 0.2 }}
        >
          {member.role}
        </motion.p>
        
        <motion.p 
          className="text-muted-foreground mb-5 leading-relaxed text-xs" 
          data-testid={`team-description-${index}`}
          whileHover={{ opacity: 0.8 }}
        >
          {member.description}
        </motion.p>
        
        {/* Social links with hover effects - only show if social exists */}
        {member.social && (
          <div className="flex justify-center space-x-4 relative z-20" data-testid={`team-social-${index}`}>
            <a
              href={member.social.twitter}
              className="p-3 rounded-full bg-muted/50 hover:bg-primary/20 transition-colors duration-200 group/social hover:scale-110 inline-block relative z-30"
              target="_blank"
              rel="noopener noreferrer"
            >
              <SiX className="w-5 h-5 text-muted-foreground group-hover/social:text-primary transition-colors" />
            </a>
            <a
              href={member.social.github}
              className="p-3 rounded-full bg-muted/50 hover:bg-primary/20 transition-colors duration-200 group/social hover:scale-110 inline-block relative z-30"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-5 h-5 text-muted-foreground group-hover/social:text-primary transition-colors" />
            </a>
          </div>
        )}
        
        {/* Glass morphism overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"
          transition={{ duration: 0.4 }}
        />
      </motion.div>
    </ScaleIn>
  );
}

export default function Team() {
  return (
    <section id="team" className="py-24 bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 relative">
        <RevealOnScroll className="text-center mb-16" data-testid="team-header">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text relative">
            チーム
            <AnimatedUnderline className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24" delay={600} />
          </h2>
          <SlideInLeft delay={300}>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              多様なスキルセットと豊富な経験を持つエンジニアが集まったプロフェッショナルチーム
            </p>
          </SlideInLeft>
        </RevealOnScroll>
        
        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <TeamCard key={member.name} member={member} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
