/**
 * True Concept — homepage behaviour
 * - EN / AR copy + RTL switching
 * - mobile menu, sticky nav, copyright year
 * - three-step project brief (hands off to email)
 *
 * English copy lives in the markup and is the source of truth. It is
 * captured once on load, so switching language only ever needs the
 * Arabic dictionary below.
 */
(function () {
    'use strict';

    var LANG_KEY = 'language';
    var html = document.documentElement;

    var AR = {
        'a11y.skip': 'تخطَّ إلى المحتوى',
        'nav.work': 'أعمالنا',
        'nav.services': 'خدماتنا',
        'nav.studio': 'الاستديو',
        'nav.brief': 'ابدأ مشروعك',
        'nav.login': 'تسجيل الدخول',
        'nav.dashboard': 'لوحة التحكم',
        'nav.start': 'ابدأ مشروعك',

        'hero.kicker': 'استديو تقني — منذ 2019',
        'hero.l1': 'نصمّم ونبني',
        'hero.l2': 'برمجيات',
        'hero.l3': 'تُحرّك أعمالك.',
        'hero.sub': 'برمجيات مخصصة ومنصات ويب وتطبيقات جوال وشبكات موثوقة وأنظمة أمنية — مبنية لفرق لا تحتمل توقّف عملياتها.',
        'hero.cta1': 'ابدأ مشروعك',
        'hero.cta2': 'شاهد ما نبنيه',
        'hero.badge': 'تأسّس 2019',

        'services.label': 'ما نفعله',
        'services.title': 'ستّ تخصصات،',
        'services.title2': 'فريق واحد.',
        'services.lede': 'نجمع الاستراتيجية والتصميم والهندسة في غرفة واحدة، حتى لا يضيع شيء بين الفكرة والتنفيذ.',
        'services.cta': 'استعرض كتالوج الخدمات',

        'svc.1.name': 'برمجيات مخصصة',
        'svc.1.desc': 'أنظمة مؤسسية وأدوات داخلية وتكاملات مبنية على طريقة عمل شركتك الفعلية.',
        'svc.2.name': 'منصات ويب',
        'svc.2.desc': 'مواقع وتطبيقات ويب سريعة وسهلة الوصول، مبنية بأحدث التقنيات ومصمّمة لتدوم.',
        'svc.3.name': 'تطبيقات الجوال',
        'svc.3.desc': 'تطبيقات أصلية ومتعددة المنصات لنظامي iOS وAndroid، من النموذج الأولي إلى النشر.',
        'svc.4.name': 'السحابة والبنية التحتية',
        'svc.4.desc': 'ترحيل واستضافة وإدارة بنية تحتية تتوسّع دون مفاجآت في التكلفة.',
        'svc.5.name': 'الشبكات',
        'svc.5.desc': 'تصميم وتركيب وصيانة شبكات موثوقة للمكاتب والفروع والمواقع.',
        'svc.6.name': 'المراقبة والأمن',
        'svc.6.desc': 'أنظمة مراقبة وتحكّم بالدخول وتحصين أمني لمقراتك وبياناتك.',

        'work.label': 'أعمال مختارة',
        'work.title': 'أُطلقت، تعمل،',
        'work.title2': 'وما زالت تعمل.',
        'work.lede': 'ثمانية منتجات تعمل اليوم — لبرنامج ولاء كندي، ومتجر إلكتروني، وتطبيق توصيل، وفريق موارد بشرية، ووكالة عقارات. كل رابط يفتح النسخة المباشرة.',
        'work.1.tag': 'بوابة عملاء',
        'work.1.name': 'بوابة Scene+ للشركات',
        'work.1.desc': 'بوابة محمية بتسجيل الدخول يدير فيها الشركاء عروضهم بأنفسهم، ويطّلع الوكلاء للقراءة فقط.',
        'work.2.tag': 'تجارة إلكترونية',
        'work.2.name': 'Your Fashionista',
        'work.2.desc': 'متجر ملابس بفلاتر وصفحات منتجات وسلة تسوّق وتقييمات عملاء.',
        'work.3.tag': 'توصيل',
        'work.3.name': 'Yalla Shop',
        'work.3.desc': 'تطبيق توصيل للبقالة والصيدلية والطعام والطرود.',
        'work.4.tag': 'منصة',
        'work.4.name': 'منصة True Concept',
        'work.4.desc': 'الموقع الذي تتصفحه الآن: حسابات وكتالوج خدمات ومتابعة الطلبات للعملاء والإدارة.',
        'work.5.tag': 'أداة داخلية',
        'work.5.name': 'نظام الموارد البشرية',
        'work.5.desc': 'أداة لإدارة الموظفين والإجازات وسير العمل الداخلي.',
        'work.6.tag': 'عقارات',
        'work.6.name': 'Future Homes',
        'work.6.desc': 'موقع عقاري بقوائم عقارات ونماذج لجمع بيانات العملاء.',
        'work.7.tag': 'مشروع ويب',
        'work.7.name': 'Al Ahli Al Masry',
        'work.7.desc': 'مشروع ويب مباشر، بُني ونُشر من البداية إلى النهاية.',
        'work.8.tag': 'تطبيق مبيعات',
        'work.8.name': 'OmniSales',
        'work.8.desc': 'تطبيق ويب للمبيعات، بُني ونُشر لفريق أعمال.',

        'studio.label': 'الاستديو',
        'studio.title': 'نحن الشريك التقني',
        'studio.title2': 'خلف العمليات اليومية.',
        'studio.p1': 'منذ 2019 نساعد الشركات على تشغيل التقنية لصالحها — استبدال الجداول بأنظمة، والأوراق بمنصات، والتقديرات بالبيانات.',
        'studio.p2': 'مهمتنا بسيطة: بناء برمجيات تُزيل التعقيد من طريقة عمل عملائنا، ثم البقاء بما يكفي للحفاظ على ذلك.',
        'studio.cta': 'اعمل معنا',
        'stat.1': 'سنوات في السوق',
        'stat.2': 'مشروع منجز',
        'stat.3': 'عميل',
        'stat.4': 'تغطية الدعم',

        'process.label': 'كيف نعمل',
        'process.title': 'ثلاث خطوات،',
        'process.title2': 'بلا استعراض.',
        'process.1.name': 'الاستكشاف',
        'process.1.desc': 'نرسم طريقة عمل الشركة اليوم، ونتفق على معنى النجاح، ونكتبه.',
        'process.2.name': 'التصميم والتنفيذ',
        'process.2.desc': 'برمجيات تعمل كل أسبوع، لا عروض تقديمية. ترى التقدّم في المنتج نفسه.',
        'process.3.name': 'الإطلاق والدعم',
        'process.3.desc': 'نتولّى الإطلاق والتدريب والمراقبة — ونبقى للصيانة والمرحلة التالية.',

        'quotes.label': 'أصوات العملاء',
        'quotes.title': 'كيف يكون',
        'quotes.title2': 'العمل معنا.',
        'quotes.1.text': 'غيّرت True Concept بنيتنا الرقمية بالكامل. كان الفريق محترفًا وسريع الاستجابة، وتجاوز التوقعات.',
        'quotes.1.role': 'الرئيس التنفيذي، Innovate Labs',
        'quotes.2.text': 'كان العمل مع True Concept نقطة تحوّل. بسّطت برمجياتهم المخصصة عملياتنا ورفعت الإنتاجية 40%.',
        'quotes.2.role': 'المدير التقني، FinServe Global',
        'quotes.3.text': 'ساعدتنا خبرتهم في السحابة والشبكات على الانتقال بسلاسة، وكان الدعم المستمر استثنائيًا.',
        'quotes.3.role': 'نائب رئيس العمليات، TechFlow',

        'brief.label': 'ابدأ مشروعك',
        'brief.title': 'أخبرنا بما',
        'brief.title2': 'تحتاج إلى بنائه.',
        'brief.lede': 'ثلاثة أسئلة سريعة، ونعود إليك بخطة وميزانية تقديرية والخطوة التالية. بلا سكربت بيع.',
        'brief.point1': 'رد خلال يوم عمل واحد',
        'brief.point2': 'مهندس باسمه في أول مكالمة',
        'brief.point3': 'تقدير بنطاق ثابت قبل أي كود',
        'brief.q1': 'ماذا تحتاج؟',
        'brief.q2': 'الميزانية والتوقيت',
        'brief.q3': 'إلى أين نرسل الخطة؟',
        'brief.budget': 'الميزانية التقديرية',
        'brief.when': 'متى تريد البدء؟',
        'brief.b1': 'أقل من 10 آلاف دولار',
        'brief.b2': '10 – 25 ألف دولار',
        'brief.b3': '25 – 60 ألف دولار',
        'brief.b4': 'أكثر من 60 ألف دولار',
        'brief.t1': 'في أقرب وقت',
        'brief.t2': 'هذا الربع',
        'brief.t3': 'أستكشف فقط',
        'brief.next': 'متابعة',
        'brief.back': 'رجوع',
        'brief.name': 'الاسم',
        'brief.email': 'البريد الإلكتروني',
        'brief.about': 'أي تفاصيل أخرى؟',
        'brief.ph': 'جملة أو جملتان عن المشكلة…',
        'brief.send': 'أرسل الموجز',
        'brief.fine': 'يفتح تطبيق البريد لديك والموجز معبّأ — لا يُخزَّن شيء على هذا الموقع.',

        'footer.sitemap': 'الموقع',
        'footer.services': 'الخدمات',
        'footer.account': 'الحساب',
        'footer.contact': 'التواصل',
        'footer.register': 'إنشاء حساب',
        'footer.city': 'سان فرانسيسكو، كاليفورنيا',
        'footer.rights': 'جميع الحقوق محفوظة.',
        'footer.built': 'استراتيجية · تصميم · هندسة'
    };

    /* Messages only ever shown by script, so they live here. */
    var ERROR = {
        en: {
            service: 'Pick at least one service.',
            budget: 'Pick a budget (or “Just exploring”).',
            fields: 'Add your name and a valid email address.'
        },
        ar: {
            service: 'اختر خدمة واحدة على الأقل.',
            budget: 'اختر ميزانية أو «أستكشف فقط».',
            fields: 'أدخل اسمك وبريدًا إلكترونيًا صحيحًا.'
        }
    };

    var MAIL = {
        en: { subject: 'Project brief', service: 'Service', budget: 'Budget', timing: 'Timing' },
        ar: { subject: 'موجز مشروع', service: 'الخدمات', budget: 'الميزانية', timing: 'التوقيت' }
    };

    function lang() {
        return html.getAttribute('lang') === 'ar' ? 'ar' : 'en';
    }

    /* ============================================================
       Language
       ============================================================ */
    var TEXT = [];
    var PLACEHOLDER = [];

    function cacheEnglish() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            TEXT.push({ el: el, key: el.getAttribute('data-i18n'), en: el.textContent.trim() });
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            PLACEHOLDER.push({
                el: el,
                key: el.getAttribute('data-i18n-placeholder'),
                en: el.getAttribute('placeholder') || ''
            });
        });
    }

    function applyLanguage(next) {
        var ar = next === 'ar';

        TEXT.forEach(function (item) {
            item.el.textContent = ar && AR[item.key] ? AR[item.key] : item.en;
        });
        PLACEHOLDER.forEach(function (item) {
            item.el.setAttribute('placeholder', ar && AR[item.key] ? AR[item.key] : item.en);
        });

        html.setAttribute('lang', next);
        html.setAttribute('dir', ar ? 'rtl' : 'ltr');

        var toggle = document.getElementById('langToggle');
        if (toggle) toggle.textContent = ar ? 'EN' : 'AR';
    }

    cacheEnglish();

    var saved = 'en';
    try { saved = localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'en'; } catch (e) { /* private mode */ }
    if (saved === 'ar') applyLanguage('ar');

    var langToggle = document.getElementById('langToggle');
    if (langToggle) {
        langToggle.addEventListener('click', function () {
            var next = lang() === 'ar' ? 'en' : 'ar';
            applyLanguage(next);
            try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* ignore */ }
        });
    }

    /* ============================================================
       Nav
       ============================================================ */
    var nav = document.getElementById('nav');
    if (nav) {
        var onScroll = function () {
            nav.classList.toggle('scrolled', window.scrollY > 12);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    var burger = document.getElementById('burger');
    var navLinks = document.getElementById('navLinks');
    if (burger && navLinks) {
        var setMenu = function (open) {
            navLinks.classList.toggle('open', open);
            burger.classList.toggle('is-open', open);
            burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        };

        burger.addEventListener('click', function () {
            setMenu(!navLinks.classList.contains('open'));
        });

        navLinks.addEventListener('click', function (event) {
            if (event.target.closest('a')) setMenu(false);
        });
    }

    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    /* ============================================================
       Project brief
       ============================================================ */
    var form = document.getElementById('briefForm');
    if (!form) return;

    var steps = form.querySelectorAll('.brief-step');
    var bars = form.querySelectorAll('.bar');
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function showStep(n) {
        steps.forEach(function (step) {
            step.classList.toggle('is-active', Number(step.dataset.step) === n);
        });
        bars.forEach(function (bar, i) {
            bar.classList.toggle('is-on', i < n);
        });
    }

    function clearErrors() {
        form.querySelectorAll('.brief-error').forEach(function (el) { el.textContent = ''; });
    }

    function showError(step, message) {
        var el = form.querySelector('[data-error-for="' + step + '"]');
        if (el) el.textContent = message;
    }

    /* Read answers straight from the page: no mirrored state to keep in sync. */
    function answers(group) {
        return Array.prototype.map.call(
            form.querySelectorAll('[data-group="' + group + '"] .chip.is-on'),
            function (chip) { return chip.textContent.trim(); }
        );
    }

    form.addEventListener('click', function (event) {
        var chip = event.target.closest('.chip');

        if (chip) {
            var group = chip.closest('[data-group]');
            if (group.dataset.group === 'service') {
                chip.classList.toggle('is-on');   // services: multiple choice
            } else {
                group.querySelectorAll('.chip.is-on').forEach(function (on) {
                    on.classList.remove('is-on');
                });
                chip.classList.add('is-on');      // budget / timing: single choice
            }
            clearErrors();
            return;
        }

        var next = event.target.closest('[data-next]');
        if (next) {
            var target = Number(next.dataset.next);
            if (target === 2 && answers('service').length === 0) {
                showError(1, ERROR[lang()].service);
                return;
            }
            if (target === 3 && answers('budget').length === 0) {
                showError(2, ERROR[lang()].budget);
                return;
            }
            showStep(target);
            return;
        }

        var back = event.target.closest('[data-back]');
        if (back) showStep(Number(back.dataset.back));
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        var name = document.getElementById('briefName').value.trim();
        var email = document.getElementById('briefEmail').value.trim();
        var message = document.getElementById('briefMessage').value.trim();

        if (name.length < 2 || !EMAIL_RE.test(email)) {
            showError(3, ERROR[lang()].fields);
            return;
        }
        clearErrors();

        var copy = MAIL[lang()];
        var body = [
            copy.service + ': ' + answers('service').join(', '),
            copy.budget + ': ' + answers('budget').join(', '),
            copy.timing + ': ' + answers('timing').join(', '),
            '',
            name + ' <' + email + '>',
            message
        ].join('\n');

        window.location.href = 'mailto:hello@trueconcept.com' +
            '?subject=' + encodeURIComponent(copy.subject) +
            '&body=' + encodeURIComponent(body);
    });
})();
