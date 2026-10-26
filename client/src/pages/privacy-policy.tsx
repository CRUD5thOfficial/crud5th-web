import { motion } from "framer-motion";
import { UserCheck, FileText, Shield, Eye, GraduationCap, RefreshCw } from "lucide-react";
import ScrollReveal, { RevealOnScroll, SlideInLeft } from "@/components/animations/scroll-reveal";
import { AnimatedUnderline } from "@/components/animations/svg-path-animation";

export default function PrivacyPolicy() {
  const policies = [
    {
      icon: UserCheck,
      title: "個人情報の取得・利用・提供",
      description: "事業活動に合わせて個人情報を保護するための管理体制を確立し、同意を得た範囲内での適切な個人情報の取得、利用及び提供に関する社内規定を定め、これを遵守し「目的外利用」はいたしません。"
    },
    {
      icon: FileText,
      title: "法令・規範の遵守",
      description: "個人情報の取扱いに関する法令、国の指針、業界ガイドライン及びその他の規範を遵守します。"
    },
    {
      icon: Shield,
      title: "リスクの予防・是正",
      description: "個人情報に対するリスク（漏えい、滅失又はき損）に関する予防措置を実施し、個人情報の正確性、安全性を厳正に管理します。個人情報に予期せぬリスクが発生した場合、速やかに是正措置を実施します。"
    },
    {
      icon: Eye,
      title: "苦情・相談への対応",
      description: "お客様及び従業員からの苦情及び相談に対しては、手順を明確化し適切に対応いたします。"
    },
    {
      icon: GraduationCap,
      title: "教育・訓練",
      description: "メンバーが個人情報保護の重要性を理解し、個人情報を適正に取り扱うよう「個人情報保護方針」を全社に浸透させ遵守させるとともに、必要な教育、啓蒙、監査を実施します。"
    },
    {
      icon: RefreshCw,
      title: "継続的改善",
      description: "事業活動環境に合わせて適宜「個人情報保護方針」の見直しを実施し、個人情報保護マネジメントシステムの継続的改善を実施します。"
    }
  ];

  const informationTypes = [
    {
      category: "お取引先様の個人情報",
      purpose: "お取引先との商談、連絡、契約の履行、履行請求等"
    },
    {
      category: "各種お問い合わせをいただいた方の個人情報",
      purpose: "お問い合わせへの対応"
    },
    {
      category: "求職者及び従業員に関する個人情報",
      purpose: "求職者の採用可否の検討・連絡、従業員の雇用管理"
    },
    {
      category: "Webサイトの利用状況",
      purpose: "サイトの改善のため、Google Analyticsを用いてページの閲覧、アクティブな閲覧時間、料金試算や相談への導線の利用状況を解析します。Cookie等を利用しますが、お問い合わせの氏名・メールアドレス・本文や、URLの検索パラメータは解析イベントに送信しません。広告向けのパーソナライズやGoogle Signalsは利用しません。"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-secondary/20 via-background to-background relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <RevealOnScroll>
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-6 gradient-text relative"
              data-testid="page-title"
            >
              個人情報保護方針
              <AnimatedUnderline className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32" delay={600} />
            </motion.h1>
            <SlideInLeft delay={300}>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                CRUD5thは、個人情報を適切に管理することは当社の事業活動の基本であるとともに、
                高度情報化社会における社会的責務と認識しています。
              </p>
            </SlideInLeft>
          </RevealOnScroll>
        </div>
      </section>

      {/* Basic Statement */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-secondary/80 to-muted/40 backdrop-blur-sm border border-border rounded-xl p-8 mb-12"
          >
            <p className="text-foreground leading-relaxed text-base">
              CRUD5th（以下、当社という）は、システム開発・受託開発・DX・ITコンサルティングサービスを営む企業として、
              個人情報を適切に管理することは当社の事業活動の基本であるとともに、高度情報化社会における社会的責務と認識しています。
              当社は事業活動にともない入手した個人情報を、適法かつ公正に取り扱うため「個人情報保護方針」を以下のとおり定め、
              個人情報保護の推進に努めます。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Policies */}
      <section className="py-16 bg-gradient-to-br from-background to-secondary/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {policies.map((policy, index) => (
              <motion.div
                key={policy.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-secondary/80 to-muted/40 backdrop-blur-sm border border-border rounded-xl p-6 group cursor-pointer h-full"
                data-testid={`policy-${index}`}
              >
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110"
                  transition={{ duration: 0.3 }}
                >
                  <policy.icon className="w-8 h-8 text-primary" />
                </motion.div>
                
                <h3 className="text-lg font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {policy.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {policy.description}
                </p>
                
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Information Usage */}
      <section className="py-16 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <RevealOnScroll className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center gradient-text relative">
              個人情報の利用目的
              <AnimatedUnderline className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24" delay={400} />
            </h2>
          </RevealOnScroll>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-secondary/80 to-muted/40 backdrop-blur-sm border border-border rounded-xl p-8"
          >
            <p className="text-foreground mb-6 leading-relaxed">
              当社が取得する個人情報の利用目的は以下のとおりです。
            </p>
            
            <div className="space-y-4">
              {informationTypes.map((type, index) => (
                <motion.div
                  key={type.category}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="border-l-4 border-primary pl-4 py-2"
                >
                  <div className="font-semibold text-foreground text-sm mb-1">
                    {type.category}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {type.purpose}
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-muted-foreground text-sm mt-6 leading-relaxed">
              アクセス解析のデータ取扱いは
              <a className="underline" href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Googleの説明</a>
              をご確認ください。収集はブラウザのCookie設定や
              <a className="underline" href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analyticsオプトアウトアドオン</a>
              で制限できます。当サイトはDo Not Trackが有効なブラウザでは計測を開始しません。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Company Information */}
      <section className="py-16 bg-gradient-to-br from-background to-secondary/10 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-secondary/80 to-muted/40 backdrop-blur-sm border border-border rounded-xl p-8"
          >
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                制定日：{new Date().getFullYear()}年{new Date().getMonth() + 1}月{new Date().getDate()}日<br />
                改定日：{new Date().getFullYear()}年{new Date().getMonth() + 1}月{new Date().getDate()}日
              </div>
              
              <div className="border-t border-border pt-4">
                <div className="text-lg font-semibold text-primary mb-2">CRUD5th</div>
                <div className="text-sm text-muted-foreground">
                  代表：髙橋 綱弥
                </div>
              </div>
              
              <div className="border-t border-border pt-4">
                <div className="text-sm font-medium text-foreground mb-2">
                  【個人情報保護方針の内容についてのお問い合わせ窓口】
                </div>
                <div className="text-sm text-muted-foreground">
                  CRUD5th<br />
                  個人情報保護管理者<br />
                  e-mail：privacy@crud5th.com
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
