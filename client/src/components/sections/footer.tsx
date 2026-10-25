import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Footer() {
  const scrollToSection = (id: string) => {
    if (id === "home") {
      window.location.assign("/");
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer className="bg-secondary/30 border-t border-border py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 md:mb-0"
            data-testid="footer-brand"
          >
            <div className="text-2xl font-bold gradient-text mb-2">CRUD5th</div>
            <div className="text-muted-foreground">エンジニアチーム</div>
          </motion.div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-4 md:gap-8"
              data-testid="footer-nav"
            >
              {[
                { label: "ホーム", id: "home" },
                { label: "サービス", id: "services" },
                { label: "チーム", id: "team" },
                { label: "お問い合わせ", id: "contact" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  data-testid={`footer-link-${item.id}`}
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col gap-2"
              data-testid="footer-compliance"
            >
              <Link 
                href="/information-security"
                className="text-muted-foreground hover:text-primary transition-colors text-xs"
              >
                情報セキュリティ基本方針
              </Link>
              <Link 
                href="/privacy-policy"
                className="text-muted-foreground hover:text-primary transition-colors text-xs"
              >
                個人情報保護方針
              </Link>
            </motion.div>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground"
          data-testid="footer-copyright"
        >
          © {new Date().getFullYear()} CRUD5th. All rights reserved.
        </motion.div>
      </div>
    </footer>
  );
}
