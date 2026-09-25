import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Mail, Phone, MapPin, Twitter, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertContactSchema } from "@shared/schema";
import { AnimatedUnderline } from "@/components/animations/svg-path-animation";
import { z } from "zod";

type ContactFormData = z.infer<typeof insertContactSchema>;

export default function Contact() {
  const { ref, isVisible } = useScrollAnimation();
  const { toast } = useToast();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: "",
      email: "",
      type: "受託開発",
      message: ""
    }
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const body = new URLSearchParams({ "form-name": "contact", ...data });
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!response.ok) {
        throw new Error("送信に失敗しました。もう一度お試しください。");
      }
    },
    onSuccess: () => {
      toast({
        title: "送信完了",
        description: "お問い合わせを受け付けました。後日担当者よりご連絡いたします。",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "送信失敗",
        description: error.message || "送信に失敗しました。もう一度お試しください。",
      });
    }
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-b from-secondary/20 to-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
          data-testid="contact-header"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text relative">
            お問い合わせ
            <AnimatedUnderline className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32" delay={600} />
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            プロジェクトのご相談やお見積もりなど、お気軽にお問い合わせください
          </p>
        </motion.div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              data-testid="contact-info"
            >
              <h3 className="text-3xl font-bold mb-10 text-foreground">直接お問い合わせ</h3>
              <div className="space-y-8">
                <div className="flex items-center space-x-5 group hover:bg-secondary/30 p-4 rounded-xl transition-all duration-300" data-testid="contact-email">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Email</div>
                    <div className="text-foreground font-semibold text-lg">crud5th@crud5th.com</div>
                  </div>
                </div>
                <div className="flex items-center space-x-5 group hover:bg-secondary/30 p-4 rounded-xl transition-all duration-300" data-testid="contact-phone">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Phone className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">電話</div>
                    <div className="text-foreground font-semibold text-lg">090-9423-8717</div>
                  </div>
                </div>
                <div className="flex items-center space-x-5 group hover:bg-secondary/30 p-4 rounded-xl transition-all duration-300" data-testid="contact-address">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">事務所住所</div>
                    <div className="text-foreground font-semibold text-lg">
                      〒106-0032<br />
                      東京都港区六本木7-17-12-513
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-16">
                <h4 className="text-xl font-semibold mb-6 text-foreground">ソーシャルリンク</h4>
                <div className="flex space-x-6" data-testid="contact-social">
                  <a 
                    href="https://x.com/CRUD5th" 
                    className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary/50 border border-border/50 rounded-xl flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                    data-testid="social-twitter"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="w-6 h-6" />
                  </a>
                  <a 
                    href="https://github.com/crudfifth" 
                    className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary/50 border border-border/50 rounded-xl flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                    data-testid="social-github"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              data-testid="contact-form"
            >
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Glass morphism overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 contact-form">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium text-base mb-3 block">お名前</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="山田太郎" 
                            className="glass-input text-white placeholder:text-gray-400 h-12 px-4" 
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage className="text-destructive mt-2" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium text-base mb-3 block">メールアドレス</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            placeholder="example@email.com" 
                            className="glass-input text-white placeholder:text-gray-400 h-12 px-4"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage className="text-destructive mt-2" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium text-base mb-3 block">お問い合わせ種別</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass-input text-white h-12 px-4" data-testid="select-category">
                              <SelectValue placeholder="選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-black/85 backdrop-blur-xl border-white/15 text-white">
                            <SelectItem value="受託開発" data-testid="option-freelance-development" className="text-white hover:bg-white/10 hover:text-primary focus:bg-white/10 focus:text-primary data-[state=checked]:text-primary">受託開発</SelectItem>
                            <SelectItem value="自社サービス開発" data-testid="option-web-service-development" className="text-white hover:bg-white/10 hover:text-primary focus:bg-white/10 focus:text-primary data-[state=checked]:text-primary">自社サービス開発</SelectItem>
                            <SelectItem value="DX・ITコンサル" data-testid="option-dx-consulting" className="text-white hover:bg-white/10 hover:text-primary focus:bg-white/10 focus:text-primary data-[state=checked]:text-primary">DX・ITコンサル</SelectItem>
                            <SelectItem value="その他" data-testid="option-other" className="text-white hover:bg-white/10 hover:text-primary focus:bg-white/10 focus:text-primary data-[state=checked]:text-primary">その他</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-destructive mt-2" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium text-base mb-3 block">メッセージ</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={5} 
                            placeholder="プロジェクトの詳細やご要望をお聞かせください..." 
                            className="glass-input text-white placeholder:text-gray-400 resize-none min-h-[140px] p-4"
                            data-testid="textarea-message"
                          />
                        </FormControl>
                        <FormMessage className="text-destructive mt-2" />
                      </FormItem>
                    )}
                  />
                  
                    <Button 
                      type="submit" 
                      className="w-full bg-black/20 backdrop-blur-xl border border-white/30 text-white hover:bg-white/10 hover:border-primary/60 transition-all duration-300 py-4 font-semibold text-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-lg" 
                      style={{
                        boxShadow: '0 0 20px rgba(46, 184, 207, 0.3), 0 0 40px rgba(46, 184, 207, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(46, 184, 207, 0.5), 0 0 60px rgba(46, 184, 207, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(46, 184, 207, 0.3), 0 0 40px rgba(46, 184, 207, 0.1)';
                      }}
                      disabled={contactMutation.isPending}
                      data-testid="button-submit"
                    >
                      {contactMutation.isPending ? "送信中..." : "送信する"}
                    </Button>
                  </form>
                </Form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
