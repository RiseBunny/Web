/*! RiseBunny — Varsayılan Veriler (Sıfırdan, temiz) */
window.RB_DATA = (function () {
  'use strict';
  return {
    products: [
      {
        id: 'risebunny-client', icon: 'fa-solid fa-cube', pIcon: 'fa-solid fa-cube',
        platform: 'Minecraft', status: 'dev', order: 0, name: 'RiseBunnyClient',
        color: '#7c3aed', image: '', download: '',
        desc: { en: 'A modern Minecraft client developed by RiseBunny.', tr: 'RiseBunny tarafından geliştirilen modern bir Minecraft istemcisi.' },
        features: { en: ['Performance-first', 'Deep customization'], tr: ['Performans odaklı', 'Derin özelleştirme'] }
      },
      {
        id: 'rubidium-client', icon: 'fa-solid fa-gem', pIcon: 'fa-solid fa-cube',
        platform: 'Minecraft', status: 'dev', order: 1, name: 'Rubidium Client',
        color: '#06b6d4', image: '', download: '',
        desc: { en: 'A powerful Minecraft client.', tr: 'Güçlü bir Minecraft istemcisi.' },
        features: { en: ['Smooth experience'], tr: ['Akıcı deneyim'] }
      },
      {
        id: 'risebrawl-v29', icon: 'fa-solid fa-star', pIcon: 'fa-solid fa-star',
        platform: 'Brawl Stars', status: 'project', order: 2, name: 'RiseBrawl V29',
        color: '#f59e0b', image: '', download: '',
        desc: { en: 'Brawl Stars V29 project.', tr: 'Brawl Stars V29 projesi.' },
        features: { en: ['Unique experience'], tr: ['Benzersiz deneyim'] }
      }
    ],
    faqs: [
      { id: 'f1', order: 0, q: { en: 'What is RiseBunny?', tr: 'RiseBunny nedir?' }, a: { en: 'A software company focused on gaming clients and community tools.', tr: 'Oyun istemcileri ve topluluk araçlarına odaklanan bir yazılım şirketidir.' } },
      { id: 'f2', order: 1, q: { en: 'Are projects free?', tr: 'Projeler ücretsiz mi?' }, a: { en: 'Most of our projects are free.', tr: 'Projelerimizin çoğu ücretsizdir.' } },
      { id: 'f3', order: 2, q: { en: 'How can I contact you?', tr: 'Size nasıl ulaşırım?' }, a: { en: 'Use the contact form below.', tr: 'Aşağıdaki iletişim formunu kullanın.' } }
    ],
    features: [
      { id: 'v1', order: 0, icon: 'fa-solid fa-lightbulb', color: '#7c3aed', title: { en: 'Innovation', tr: 'İnovasyon' }, desc: { en: 'We build what others do not.', tr: 'Başkalarının yapmadığını inşa ederiz.' } },
      { id: 'v2', order: 1, icon: 'fa-solid fa-bolt', color: '#06b6d4', title: { en: 'Performance', tr: 'Performans' }, desc: { en: 'Fast and smooth by default.', tr: 'Varsayılan olarak hızlı ve akıcı.' } },
      { id: 'v3', order: 2, icon: 'fa-solid fa-users', color: '#10b981', title: { en: 'Community', tr: 'Topluluk' }, desc: { en: 'Built with and for the community.', tr: 'Toplulukla ve topluluk için geliştirilir.' } },
      { id: 'v4', order: 3, icon: 'fa-solid fa-shield-halved', color: '#f59e0b', title: { en: 'Security', tr: 'Güvenlik' }, desc: { en: 'Safety first in every release.', tr: 'Her sürümde önce güvenlik.' } }
    ],
    i18n: {
      en: {
        nav_home: 'Home', nav_products: 'Products', nav_about: 'About', nav_faq: 'FAQ', nav_contact: 'Contact',
        hero_badge: 'RiseBunny Software',
        hero_title: 'Rise <span class="gradient-text">Beyond Limits.</span>',
        hero_sub: 'Innovative software. Powerful experiences. Built by RiseBunny.',
        hero_desc: 'RiseBunny develops innovative gaming clients, game projects and community-focused software.',
        btn_explore: 'Explore Products', btn_learn: 'Learn More',
        prod_title: 'Our Products', prod_sub: 'Explore the software and projects built by RiseBunny.',
        view_details: 'View Details', status_dev: 'In Development', status_project: 'Project', status_active: 'Active',
        feat_title: 'Why RiseBunny?', feat_sub: 'The values that drive everything we build.',
        about_title: 'Built to Rise.',
        about_p1: 'RiseBunny is a software company focused on creating innovative gaming software, custom clients and community tools.',
        about_p2: 'We bridge the gap between complex technology and great user experience.',
        eco_title: 'Our Ecosystem', eco_sub: 'The platforms RiseBunny builds for.',
        faq_title: 'Frequently Asked Questions',
        contact_title: "Let's Build Something Great.", contact_sub: 'Have a question, collaboration idea or feedback?',
        discord_title: 'Join Our Community', discord_desc: 'Our Discord invite link will be shared here very soon.',
        lbl_name: 'Name', lbl_email: 'Email', lbl_subject: 'Subject', lbl_message: 'Message',
        ph_name: 'Your name', ph_email: 'you@example.com', ph_subject: 'Subject', ph_message: 'Your message...',
        btn_send: 'Send Message', btn_sending: 'Sending…', form_success: 'Message sent!', form_mailto: 'Opening email app…',
        form_note: 'Your message is transmitted over an encrypted connection.',
        footer_slogan: 'Rise Beyond Limits.', footer_nav: 'Navigation', footer_legal: 'Legal', footer_contact: 'Contact',
        privacy: 'Privacy Policy', terms: 'Terms of Service',
        copyright: '© 2026 RiseBunny. All rights reserved.',
        modal_features: 'Key Features', btn_community: 'Join Community', btn_download: 'Coming Soon', btn_download_now: 'Download'
      },
      tr: {
        nav_home: 'Ana Sayfa', nav_products: 'Ürünler', nav_about: 'Hakkımızda', nav_faq: 'SSS', nav_contact: 'İletişim',
        hero_badge: 'RiseBunny Yazılım',
        hero_title: 'Sınırların <span class="gradient-text">Ötesine Yüksel.</span>',
        hero_sub: 'Yenilikçi yazılım. Güçlü deneyimler. RiseBunny imzasıyla.',
        hero_desc: 'RiseBunny; yenilikçi oyun istemcileri, oyun projeleri ve topluluk odaklı yazılımlar geliştirir.',
        btn_explore: 'Ürünleri Keşfet', btn_learn: 'Daha Fazla',
        prod_title: 'Ürünlerimiz', prod_sub: 'RiseBunny tarafından geliştirilen yazılım ve projeleri keşfedin.',
        view_details: 'Detayları Gör', status_dev: 'Geliştirmede', status_project: 'Proje', status_active: 'Aktif',
        feat_title: 'Neden RiseBunny?', feat_sub: 'Yaptığımız her şeyi yönlendiren değerler.',
        about_title: 'Yükselmek İçin İnşa Edildi.',
        about_p1: 'RiseBunny; yenilikçi oyun yazılımları, özel istemciler ve topluluk araçları geliştirmeye odaklanan bir yazılım şirketidir.',
        about_p2: 'Karmaşık teknoloji ile harika kullanıcı deneyimi arasındaki köprüyü kurarız.',
        eco_title: 'Ekosistemimiz', eco_sub: 'RiseBunny tarafından geliştirme yapılan platformlar.',
        faq_title: 'Sıkça Sorulan Sorular',
        contact_title: 'Harika Bir Şey İnşa Edelim.', contact_sub: 'Bir sorunuz, iş birliği fikriniz veya geri bildiriminiz mi var?',
        discord_title: 'Topluluğumuza Katıl', discord_desc: 'Discord davet linkimiz çok yakında burada paylaşılacak.',
        lbl_name: 'İsim', lbl_email: 'E-posta', lbl_subject: 'Konu', lbl_message: 'Mesaj',
        ph_name: 'Adınız', ph_email: 'ornek@eposta.com', ph_subject: 'Konu', ph_message: 'Mesajınız...',
        btn_send: 'Mesaj Gönder', btn_sending: 'Gönderiliyor…', form_success: 'Mesaj gönderildi!', form_mailto: 'E-posta uygulaması açılıyor…',
        form_note: 'Mesajınız şifreli bağlantı üzerinden iletilir.',
        footer_slogan: 'Sınırların Ötesine Yüksel.', footer_nav: 'Navigasyon', footer_legal: 'Yasal', footer_contact: 'İletişim',
        privacy: 'Gizlilik Politikası', terms: 'Kullanım Şartları',
        copyright: '© 2026 RiseBunny. Tüm hakları saklıdır.',
        modal_features: 'Öne Çıkan Özellikler', btn_community: 'Topluluğa Katıl', btn_download: 'Çok Yakında', btn_download_now: 'İndir'
      }
    }
  };
})();