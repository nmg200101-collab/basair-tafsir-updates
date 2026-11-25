# P223 — مرشح إصلاح المتابعة الصوتية للطبعتين

حالة العمل: STAGED / NOT SIGNED / NOT PUBLISHED. المرجع: P222 Seq141, main commit 42cb395e51c4eabde61749b4621e0da7f7795c85.

## نتائج المالك 25 نوفمبر 2026
PASS: الأصلية صامتة، حركة الخطوط الآلية، ظل الكلمات، عدم وجود ظل ثابت إضافي.
FAIL: الأصلية بالصوت، الملونة بالصوت.

## التغييرات
- p223-native-printed-audio-scroll.js: مرشح يستجيب لأحداث timeupdate الحقيقية للمشغل المعروف tilawaAudio. يتطلب تقدم B345 فعليًا وبطاقة R33 جاهزة ومرئية، ويحرك حاوية التمرير الموجودة فقط عند ثبوت توقف الحركة. لا transform ولا إخفاء ولا نسخ للصفحة ولا توقيت مصطنع؛ يعيد scrollTop عند عدم تغير موضع البطاقة. يقتصر على الطبعات المطبوعة 100% original/tajwid ولا يتدخل في الصامت أو الرقمي أو pause.
- p223-tajwid-native-audio.js: بديل مرحلي لملف p213-tajwid-static-follow-v2.js. يوجه صوت الملونة 100% إلى B345/R33 مع P205، ولا يشغل P212 المستقل للصوت؛ يبقي P212 الصامت. يعيد إظهار أدوات B345 أثناء الجلسة.
- p223-printed-route-adapters.js: بديل مرحلي لملف p214-follow-route-adapters.js؛ يختار B345 للملونة بالصوت ويحتفظ بالمسارات الأخرى. لا يجوز تحميل البديلين مع أصليهما بسبب duplicate global guards؛ لا تغيير للملفات الحية.

## التحقق الذي تم
3/3 syntax via V8 Function compilation of GitHub staging files.
15/15 isolated JS checks on the staged scroll and route adapter sources: initial reset, real progress, existing native movement, stalled clock, changed page, backward seek, actual scroll, rollback of false scroll, colored native audio ownership, native pause/resume, stop, unchanged colored silent, silent stop, unchanged original route, original stop.
These checks use mock state and geometry, not Android V695. The direct P212 UI/wrapper route has syntax checking only. No real B345 native source or device WebView in this session; event identity, state.progress semantics, visibility and direct UI routing still need actual verification. If a hidden R33 surface is the cause, the scroll repair deliberately fails closed rather than overriding the visible Mushaf again.

## بوابة النشر
لا تغيير لبيان owner-qa أو APK أو التوقيع أو بيانات المستخدم. تحقق أولًا من مصدر V695 الحقيقي ومن أن الحدث والبطاقة والمسار متوافقة، ثم اختبار مركّز حقيقي للطبعتين (حركة فعلية، عبور الصفحة، pause/resume/stop) والحالات الأربع الناجحة. جهز بيانًا موقعًا بمفاتيح المالك الأصلية وحزمة رجوع أعلى sequence إلى محتويات P222 قبل نشر أي مرشح. لا تفعّل هذا الفرع بوصفه تحديثًا صالحًا قبل ذلك.
