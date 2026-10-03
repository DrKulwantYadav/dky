"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Activity, Droplets, Eye, Footprints, HeartPulse, Leaf, ShieldCheck, Stethoscope } from "lucide-react";
import JsonLd from "../../JsonLd";
import SiteFooter from "../../SiteFooter";
import { breadcrumbSchema, physicianId, siteUrl } from "../../seo";
import "./diabetes.css";

type Language = "en" | "hi";
const phone = "tel:+919205775932";
const appointmentUrl = "https://www.drkulwantyadav.com/book-appointment";
const whatsappMessage = "Hello, I would like to request a diabetes consultation with Dr. Kulwant Yadav. Please share the available appointment timings.";
const whatsapp = `https://wa.me/919205775932?text=${encodeURIComponent(whatsappMessage)}`;

const copy = {
  en: {
    emergencyStrip: "If symptoms are severe, seek emergency care—do not wait for an appointment.",
    allConditions: "All conditions", about: "About the doctor", library: "Health library", book: "Book Appointment", heroBook: "Book a Diabetes Consultation", whatsapp: "WhatsApp", call: "Call", directions: "Get directions", languages: "Page language", nav: "On this page", sourceLabel: "Educational sources", learn: "Understand Diabetes", discuss: "Discuss Your Reports with the Doctor", request: "Request an Appointment", clinicCall: "Call the clinic", clinicWhatsApp: "Request on WhatsApp", back: "Back to conditions", eyebrow: "Diabetes Care • Bhiwadi, Rajasthan", title: "Understand Your Diabetes. Take the Next Step in Your Care.", hero: "Learn about blood sugar, treatment and everyday habits—and get personalised medical guidance from Dr. Kulwant Yadav.", doctorRole: "Consultant in Internal Medicine", hospital: "Gopinath Hospital, Bhiwadi", heroCardTitle: "Care that looks at the whole picture", heroCardBody: "Blood sugar, blood pressure, kidney health and daily life are connected. Your plan should reflect you—not only one report.",
    sectionLinks: [["Understand", "#understand"], ["Symptoms & risk", "#symptoms"], ["Know your numbers", "#numbers"], ["Daily care", "#management"], ["Food guidance", "#food"], ["Consultation", "#consultation"], ["FAQs", "#faqs"]],
    understandEyebrow: "01 / Start with the basics", understandTitle: "What is diabetes?", understandIntro: "Glucose is a type of sugar in your blood that gives the body energy. Insulin is a hormone that helps glucose move from the blood into the body’s cells. Diabetes happens when the body makes too little insulin or cannot use it well, so blood glucose stays too high.", typesNote: "Treatment is different for each type. A clinician needs to identify the type before planning care.", types: [
      ["Prediabetes", "Blood glucose is higher than usual but not yet in the diabetes range. It is a chance to discuss risk and practical changes."],
      ["Type 1 diabetes", "The body makes little or no insulin. Insulin treatment is essential, and care needs ongoing monitoring."],
      ["Type 2 diabetes", "The body does not use insulin effectively and may gradually make less. Care may include everyday changes, medicines and sometimes insulin."],
      ["Gestational diabetes", "Diabetes first recognised during pregnancy needs coordinated obstetric and diabetes care. Ask your pregnancy-care team for the right plan."],
    ],
    symptomsEyebrow: "02 / Notice, then assess", symptomsTitle: "Symptoms and risk factors are not the same thing.", symptomsIntro: "Symptoms are changes you may notice. Risk factors are things that can make type 2 diabetes more likely. Symptoms alone cannot diagnose diabetes, and diabetes may occur without noticeable symptoms.", symptomsLabel: "Possible symptoms", riskLabel: "Common type 2 risk factors", symptoms: ["More thirst than usual", "Passing urine often", "Unusual tiredness", "Blurred vision", "Unexplained weight loss", "Slow-healing wounds or repeated infections"], risks: ["A family history of type 2 diabetes", "Less physical activity", "Excess weight, especially around the waist", "Diabetes during a previous pregnancy"], symptomsFoot: "A blood test and clinical assessment—not a symptom checklist—help establish what is happening.",
    numbersEyebrow: "03 / Understand your reports", numbersTitle: "Know your numbers, without judging yourself by one result.", numbersIntro: "These measurements answer different questions. Laboratory criteria used to diagnose diabetes are not the same as the personal treatment goals agreed with your doctor. One result may need confirmation, and HbA1c can be less reliable in some conditions, including pregnancy or some blood disorders.", numbers: [
      ["Fasting blood glucose", "Measures glucose after an overnight fast. It can help assess or diagnose diabetes when interpreted with the right laboratory criteria."],
      ["HbA1c", "Estimates average glucose over roughly the previous three months. It can support diagnosis and follow-up, but may not suit every person."],
      ["Post-meal glucose", "A reading after food may reveal patterns that fasting glucose misses, when your clinician advises checking it."],
      ["Blood pressure & cholesterol", "These help assess heart and blood-vessel risk alongside glucose, rather than treating sugar in isolation."],
      ["Kidney function & urine albumin", "Blood and urine tests can help identify kidney changes early and guide safer treatment choices."],
    ], numbersFoot: "Do not change medicines or label yourself from one home reading. Bring the report, test date and your medicine list to a consultation.",
    managementEyebrow: "04 / A plan for real life", managementTitle: "Six pillars of ongoing care.", managementIntro: "Your plan depends on diabetes type, medical history, kidney function, other conditions, medicines and goals. Nothing here replaces an individual prescription.", pillars: [
      ["Sustainable food choices", "Build regular meals that fit your household and preferences; avoid rigid rules that you cannot maintain."],
      ["Movement that suits you", "Activity can support glucose and heart health. Start at a level appropriate for your health and mobility."],
      ["Medicines or insulin", "Take treatment as prescribed. Do not stop or change doses without advice, even when a reading improves."],
      ["Glucose monitoring", "Home checks may help in some treatment plans. Ask when to test and what action a result should prompt."],
      ["Sleep, stress & tobacco", "Support sleep, discuss stress and avoid tobacco. These habits matter alongside medication."],
      ["Follow-up & screening", "Regular review can include eyes, feet, kidneys, blood pressure and cholesterol when clinically appropriate."],
    ],
    cureEyebrow: "A question worth asking", cureTitle: "Can diabetes be cured?", cureBody: "Diabetes care can improve health and reduce the chance of complications. Some people with type 2 diabetes achieve remission—glucose staying below the diabetes range without glucose-lowering medicine for a period of time. Remission is not a guaranteed, permanent cure: glucose can rise again, so follow-up remains important. Type 1 diabetes requires insulin treatment.",
    foodEyebrow: "05 / Everyday Indian meals", foodTitle: "Keep familiar food. Build a more balanced plate.", foodIntro: "Roti, rice, dal, vegetables, curd and fruit can fit into an individual meal plan. Amounts, timing and food choices should reflect your medicines, work schedule, preferences and other health conditions. No one needs to assume they must completely stop rice or roti.", plateLabel: "Illustrative balanced plate—not a prescription", plateHalf: "½ plate", plateHalfText: "Non-starchy vegetables: sabzi, salad, leafy greens", plateQuarter: "¼ plate", plateQuarterText: "Protein: dal, beans, curd, paneer, egg or fish", plateCarb: "¼ plate", plateCarbText: "Roti or rice; consider fibre-rich choices and portions", foodNote: "Choose water instead of sugary drinks more often. Whole fruit has fibre and is generally more filling than juice; portion and timing still matter.",
    protectEyebrow: "06 / Beyond blood sugar", protectTitle: "Protect your long-term health.", protectIntro: "Regular assessment can help identify changes early. Your doctor will choose the checks that fit your situation.", protect: [
      ["Heart & blood pressure", "Review blood pressure, cholesterol and heart risk together with glucose.", "/conditions/hypertension", "Explore blood pressure"],
      ["Kidney health", "Blood kidney-function and urine albumin tests can show changes before symptoms appear.", "/conditions/kidney-disease", "Explore kidney health"],
      ["Eye health", "A planned eye examination can look for changes that may not affect vision at first.", "/health-library/diabetes-when-to-consult-a-physician", "Read the diabetes follow-up guide"],
      ["Feet & nerves", "Report numbness, pain or wounds, and ask how often your feet should be checked.", "/health-library/diabetes-when-to-consult-a-physician", "Read the diabetes follow-up guide"],
      ["Weight & liver", "Weight and fatty-liver health may influence the overall metabolic picture.", "/conditions/fatty-liver-masld", "Explore fatty liver"],
    ],
    journeyEyebrow: "07 / Your visit", journeyTitle: "What to expect at a consultation.", journeyIntro: "A useful appointment is a conversation, not a fixed list of tests. Investigations are chosen only when clinically appropriate; availability of individual tests at the hospital should be confirmed separately.", journey: ["Talk through symptoms, history and glucose patterns", "Review medicines, prescriptions and previous reports", "Assess relevant heart, kidney and other risks", "Choose investigations when they answer a clinical question", "Agree on a personalised plan and follow-up"], bringTitle: "What to bring", bring: ["Previous prescriptions and an up-to-date medicine list", "Recent blood test reports", "Home glucose readings, if you have them", "A short list of questions you want answered"],
    doctorEyebrow: "Your physician", doctorTitle: "Dr. Kulwant Yadav", doctorBody: "Dr. Yadav is a Consultant in Internal Medicine at Gopinath Hospital, Bhiwadi. His adult-medicine approach considers diabetes alongside blood pressure, kidney, liver and other health concerns, with referral or coordinated care when needed.", doctorLink: "Read his verified profile",
    appointmentEyebrow: "08 / Make contact", appointmentTitle: "Request a diabetes consultation.", appointmentBody: "Call or send the prepared WhatsApp message to ask the clinic for available appointment timings. A request is not a confirmed slot; please wait for the clinic’s reply before travelling.", appointmentNote: "The general website’s online appointment form is currently a preview and does not send requests. Please use phone or WhatsApp for a real appointment request.", privacy: "Please do not send reports or detailed medical history in the initial message. The clinic can advise on a suitable, private way to share information.",
    locationEyebrow: "Visit us in Bhiwadi", locationTitle: "Clinic location", address: "H-226, Industrial Area, near Ramphal Cinema, Bhiwadi, Rajasthan 301019", hours: "Consultation hours have not been verified online. Please call before visiting.",
    faqEyebrow: "Clear answers", faqTitle: "Frequently asked questions", faqs: [
      ["Can diabetes occur without symptoms?", "Yes. Type 2 diabetes may develop quietly. Testing can be appropriate based on risk factors even when you feel well."],
      ["What is the difference between prediabetes and diabetes?", "Prediabetes means glucose is above the usual range but below the diabetes diagnostic range. A clinician interprets laboratory results and decides whether confirmation is needed."],
      ["What does HbA1c measure?", "It estimates average blood glucose over roughly three months. Certain conditions can make it less reliable, so your doctor may use another test."],
      ["Does one high reading confirm diabetes?", "Usually not. In the absence of clear symptoms or a glucose emergency, diagnosis generally needs confirmatory laboratory testing."],
      ["Can diabetes be cured or go into remission?", "Some people with type 2 diabetes reach remission, but it is not a guaranteed permanent cure. Monitoring continues. Type 1 diabetes still requires insulin."],
      ["Does everyone with diabetes need insulin?", "No. Treatment depends on type and individual needs. Type 1 diabetes requires insulin; some people with type 2 diabetes may also need it."],
      ["Can I eat rice, roti and fruit?", "Often yes, in portions that suit your individual plan. Whole fruit is generally preferable to juice. Discuss timing if you use medicines that can cause low glucose."],
      ["How often should I check blood sugar?", "It depends on your treatment, risk of low glucose and the question being monitored. Ask your clinician for a personal schedule."],
      ["Can diabetes and high blood pressure be managed together?", "Yes. They share heart and kidney risks, so a coordinated plan is useful."],
      ["What should I bring to my appointment?", "Bring prescriptions, medicines, recent reports, a home glucose log if available and the questions you want to discuss."],
    ],
    urgentTitle: "Warning signs need urgent care", urgentBody: "Confusion, loss of consciousness, persistent vomiting, deep rapid breathing, severe dehydration or low glucose that is not improving require urgent medical assessment. Seek emergency care now rather than waiting for a routine appointment.",
    sourcesIntro: "Educational content is based on the following patient and clinical resources. It has not been separately marked as reviewed by Dr. Yadav.", sourceNames: ["NIDDK — Diabetes tests and diagnosis", "NIDDK — Healthy living with diabetes", "NIDDK — Diabetes symptoms and causes", "WHO — Diabetes fact sheet", "ADA — 2026 diagnosis and classification standards", "NIDDK — Type 2 diabetes remission"], disclaimer: "Medical disclaimer: This page provides general education, not a diagnosis or an individual treatment plan. Please discuss symptoms, reports and treatment decisions with a qualified healthcare professional.",
  },
  hi: {
    emergencyStrip: "गंभीर लक्षण हों तो अपॉइंटमेंट का इंतज़ार न करें—तुरंत आपातकालीन चिकित्सा लें।",
    allConditions: "सभी स्वास्थ्य विषय", about: "डॉक्टर के बारे में", library: "स्वास्थ्य जानकारी", book: "अपॉइंटमेंट लें", heroBook: "मधुमेह परामर्श के लिए संपर्क करें", whatsapp: "व्हाट्सऐप", call: "कॉल करें", directions: "रास्ता देखें", languages: "पेज की भाषा", nav: "इस पेज पर", sourceLabel: "जानकारी के स्रोत", learn: "मधुमेह समझें", discuss: "अपनी रिपोर्ट डॉक्टर से समझें", request: "अपॉइंटमेंट का अनुरोध करें", clinicCall: "क्लिनिक को कॉल करें", clinicWhatsApp: "व्हाट्सऐप पर अनुरोध भेजें", back: "सभी स्वास्थ्य विषय", eyebrow: "मधुमेह देखभाल • भिवाड़ी, राजस्थान", title: "अपने मधुमेह को समझें। देखभाल में अगला कदम उठाएँ।", hero: "रक्त शर्करा, इलाज और रोज़मर्रा की आदतों के बारे में जानें—और डॉ. कुलवंत यादव से अपनी ज़रूरत के अनुसार चिकित्सा सलाह लें।", doctorRole: "आंतरिक चिकित्सा सलाहकार", hospital: "गोपीनाथ अस्पताल, भिवाड़ी", heroCardTitle: "पूरी सेहत को ध्यान में रखकर देखभाल", heroCardBody: "रक्त शर्करा, रक्तचाप, गुर्दों की सेहत और दिनचर्या आपस में जुड़े हैं। इलाज की योजना केवल एक रिपोर्ट से तय नहीं होती।",
    sectionLinks: [["मधुमेह समझें", "#understand"], ["लक्षण और जोखिम", "#symptoms"], ["जाँचें", "#numbers"], ["रोज़ की देखभाल", "#management"], ["भोजन", "#food"], ["परामर्श", "#consultation"], ["सवाल", "#faqs"]],
    understandEyebrow: "01 / बुनियादी जानकारी", understandTitle: "मधुमेह क्या है?", understandIntro: "ग्लूकोज़ रक्त में मौजूद एक प्रकार की शर्करा है, जिससे शरीर को ऊर्जा मिलती है। इंसुलिन एक हार्मोन है जो ग्लूकोज़ को रक्त से शरीर की कोशिकाओं तक पहुँचाने में मदद करता है। जब शरीर पर्याप्त इंसुलिन नहीं बनाता या उसे ठीक से इस्तेमाल नहीं कर पाता, तो रक्त में ग्लूकोज़ अधिक रह सकता है—इसे मधुमेह कहते हैं।", typesNote: "हर प्रकार का इलाज अलग होता है। देखभाल की योजना बनाने से पहले चिकित्सक को मधुमेह का प्रकार समझना होता है।", types: [
      ["प्रीडायबिटीज़", "रक्त शर्करा सामान्य से अधिक है, लेकिन मधुमेह की जाँच-सीमा तक नहीं पहुँची। यह जोखिम और उपयोगी बदलावों पर बात करने का समय है।"],
      ["टाइप 1 मधुमेह", "शरीर बहुत कम या बिल्कुल इंसुलिन नहीं बनाता। इंसुलिन से इलाज और नियमित निगरानी ज़रूरी है।"],
      ["टाइप 2 मधुमेह", "शरीर इंसुलिन का असर ठीक से नहीं ले पाता और समय के साथ कम इंसुलिन भी बना सकता है। देखभाल में आदतें, दवाएँ और कभी-कभी इंसुलिन शामिल हो सकते हैं।"],
      ["गर्भावस्था में मधुमेह", "गर्भावस्था में पहली बार पहचाने गए मधुमेह के लिए प्रसूति और मधुमेह देखभाल का समन्वय ज़रूरी है। अपनी गर्भावस्था देखभाल टीम से योजना पूछें।"],
    ],
    symptomsEyebrow: "02 / पहचानें, फिर जाँचें", symptomsTitle: "लक्षण और जोखिम के कारण अलग-अलग हैं।", symptomsIntro: "लक्षण वे बदलाव हैं जो आप महसूस कर सकते हैं। जोखिम के कारण टाइप 2 मधुमेह की संभावना बढ़ा सकते हैं। केवल लक्षणों से निदान नहीं होता; बिना स्पष्ट लक्षणों के भी मधुमेह हो सकता है।", symptomsLabel: "संभावित लक्षण", riskLabel: "टाइप 2 के सामान्य जोखिम कारक", symptoms: ["अधिक प्यास लगना", "बार-बार पेशाब आना", "असामान्य थकान", "धुंधला दिखाई देना", "बिना कारण वजन घटना", "घाव देर से भरना या बार-बार संक्रमण होना"], risks: ["परिवार में टाइप 2 मधुमेह", "शारीरिक गतिविधि कम होना", "अधिक वजन, विशेषकर कमर के आसपास", "पिछली गर्भावस्था में मधुमेह"], symptomsFoot: "क्या हो रहा है, यह समझने के लिए रक्त जाँच और चिकित्सकीय मूल्यांकन ज़रूरी हैं—सिर्फ लक्षणों की सूची नहीं।",
    numbersEyebrow: "03 / अपनी रिपोर्ट समझें", numbersTitle: "अपनी जाँचें समझें—एक परिणाम से खुद को न आँकें।", numbersIntro: "हर जाँच अलग जानकारी देती है। मधुमेह के निदान की प्रयोगशाला-सीमाएँ और इलाज के आपके व्यक्तिगत लक्ष्य अलग होते हैं। एक परिणाम की पुष्टि करनी पड़ सकती है। गर्भावस्था या कुछ रक्त संबंधी स्थितियों में HbA1c कम भरोसेमंद हो सकती है।", numbers: [
      ["खाली पेट रक्त शर्करा", "रात भर बिना भोजन के बाद ग्लूकोज़ मापती है। सही प्रयोगशाला मानकों के साथ इसका उपयोग जाँच या निदान में हो सकता है।"],
      ["HbA1c", "लगभग पिछले तीन महीनों की औसत रक्त शर्करा का अनुमान देती है। निदान और आगे की देखभाल में उपयोगी है, पर हर व्यक्ति के लिए उपयुक्त नहीं।"],
      ["भोजन के बाद ग्लूकोज़", "डॉक्टर की सलाह पर की गई जाँच ऐसे बदलाव दिखा सकती है जो खाली पेट की जाँच में नहीं दिखते।"],
      ["रक्तचाप और कोलेस्ट्रॉल", "रक्त शर्करा के साथ दिल और रक्त-नलिकाओं का जोखिम समझने में मदद करते हैं।"],
      ["गुर्दों की जाँच और पेशाब में एल्ब्यूमिन", "रक्त और पेशाब की जाँच गुर्दों में शुरुआती बदलाव पहचानने और सुरक्षित इलाज चुनने में मदद कर सकती है।"],
    ], numbersFoot: "एक घरेलू रीडिंग से स्वयं निदान या दवा में बदलाव न करें। डॉक्टर को रिपोर्ट, जाँच की तारीख और दवाओं की सूची दिखाएँ।",
    managementEyebrow: "04 / जीवन के अनुकूल योजना", managementTitle: "देखभाल के छह महत्वपूर्ण हिस्से।", managementIntro: "योजना मधुमेह के प्रकार, पुराने रोगों, गुर्दों की स्थिति, दूसरी समस्याओं, दवाओं और आपके लक्ष्यों पर निर्भर करती है। यह जानकारी व्यक्तिगत पर्चे का विकल्प नहीं है।", pillars: [
      ["टिकाऊ भोजन की आदतें", "परिवार और पसंद के अनुरूप नियमित भोजन चुनें; ऐसे कठोर नियमों से बचें जिन्हें निभाना मुश्किल हो।"],
      ["अपनी क्षमता के अनुसार गतिविधि", "शारीरिक गतिविधि रक्त शर्करा और दिल की सेहत में मदद कर सकती है। अपनी स्थिति के अनुसार शुरुआत करें।"],
      ["दवाएँ या इंसुलिन", "निर्देश के अनुसार इलाज लें। रीडिंग बेहतर होने पर भी सलाह के बिना खुराक न बदलें या दवा बंद न करें।"],
      ["ग्लूकोज़ की निगरानी", "कुछ योजनाओं में घर पर जाँच उपयोगी होती है। कब जाँचें और परिणाम पर क्या करें, डॉक्टर से पूछें।"],
      ["नींद, तनाव और तंबाकू", "नींद का ध्यान रखें, तनाव पर बात करें और तंबाकू से बचें। ये दवा के साथ भी महत्वपूर्ण हैं।"],
      ["नियमित फॉलो-अप", "आवश्यकतानुसार आँखों, पैरों, गुर्दों, रक्तचाप और कोलेस्ट्रॉल की जाँच हो सकती है।"],
    ],
    cureEyebrow: "एक ज़रूरी सवाल", cureTitle: "क्या मधुमेह पूरी तरह ठीक हो सकता है?", cureBody: "अच्छी देखभाल से सेहत बेहतर हो सकती है और जटिलताओं का जोखिम घट सकता है। टाइप 2 मधुमेह वाले कुछ लोग रिमिशन तक पहुँचते हैं—कुछ समय तक शर्करा मधुमेह की सीमा से नीचे रहती है, बिना शर्करा घटाने वाली दवा के। रिमिशन हमेशा रहने वाला निश्चित इलाज नहीं है; शर्करा फिर बढ़ सकती है, इसलिए निगरानी जारी रहती है। टाइप 1 मधुमेह में इंसुलिन ज़रूरी है।",
    foodEyebrow: "05 / घर का परिचित भोजन", foodTitle: "परिचित भोजन रखें। थाली में संतुलन लाएँ।", foodIntro: "रोटी, चावल, दाल, सब्ज़ी, दही और फल व्यक्तिगत भोजन योजना का हिस्सा हो सकते हैं। मात्रा और समय आपकी दवाओं, काम, पसंद और दूसरी बीमारियों के अनुसार तय हों। यह न मानें कि सभी को चावल या रोटी पूरी तरह छोड़नी होगी।", plateLabel: "संतुलित थाली का उदाहरण—व्यक्तिगत पर्चा नहीं", plateHalf: "½ थाली", plateHalfText: "कम स्टार्च वाली सब्ज़ियाँ: सब्ज़ी, सलाद, हरी पत्तियाँ", plateQuarter: "¼ थाली", plateQuarterText: "प्रोटीन: दाल, फलियाँ, दही, पनीर, अंडा या मछली", plateCarb: "¼ थाली", plateCarbText: "रोटी या चावल; रेशेदार विकल्प और मात्रा पर ध्यान दें", foodNote: "मीठे पेयों की जगह अक्सर पानी चुनें। पूरे फल में रेशा होता है और वह जूस से अधिक पेट भरता है; मात्रा और समय फिर भी मायने रखते हैं।",
    protectEyebrow: "06 / शर्करा से आगे", protectTitle: "लंबे समय की सेहत की रक्षा करें।", protectIntro: "नियमित मूल्यांकन से बदलाव जल्दी पहचाने जा सकते हैं। आपकी स्थिति के अनुसार डॉक्टर जाँच चुनेंगे।", protect: [
      ["दिल और रक्तचाप", "रक्तचाप, कोलेस्ट्रॉल और दिल का जोखिम रक्त शर्करा के साथ देखें।", "/conditions/hypertension", "रक्तचाप के बारे में पढ़ें"],
      ["गुर्दों की सेहत", "रक्त और पेशाब की जाँच लक्षणों से पहले बदलाव दिखा सकती है।", "/conditions/kidney-disease", "गुर्दों के बारे में पढ़ें"],
      ["आँखों की सेहत", "नियमित नेत्र-जाँच ऐसे बदलाव पकड़ सकती है जो शुरुआत में दृष्टि को प्रभावित न करें।", "/health-library/diabetes-when-to-consult-a-physician", "मधुमेह फॉलो-अप जानकारी पढ़ें"],
      ["पैर और नसें", "सुन्नपन, दर्द या घाव बताएँ और पूछें कि पैरों की जाँच कितनी बार होनी चाहिए।", "/health-library/diabetes-when-to-consult-a-physician", "मधुमेह फॉलो-अप जानकारी पढ़ें"],
      ["वजन और यकृत", "वजन और फैटी लिवर पूरी चयापचय सेहत से जुड़े हो सकते हैं।", "/conditions/fatty-liver-masld", "फैटी लिवर के बारे में पढ़ें"],
    ],
    journeyEyebrow: "07 / आपकी मुलाकात", journeyTitle: "परामर्श में क्या होगा?", journeyIntro: "परामर्श बातचीत है, सभी के लिए जाँचों की तय सूची नहीं। ज़रूरत के अनुसार ही जाँच चुनी जाती है; अस्पताल में किसी विशेष जाँच की उपलब्धता अलग से पूछें।", journey: ["लक्षण, पुरानी बीमारी और ग्लूकोज़ के रुझान पर बात", "दवाओं, पर्चों और पुरानी रिपोर्टों की समीक्षा", "दिल, गुर्दों और अन्य संबंधित जोखिमों का आकलन", "चिकित्सकीय प्रश्न के अनुसार जाँच का चयन", "व्यक्तिगत योजना और फॉलो-अप पर सहमति"], bringTitle: "क्या साथ लाएँ", bring: ["पुराने पर्चे और वर्तमान दवाओं की सूची", "हाल की रक्त-जाँच रिपोर्ट", "घर की ग्लूकोज़ रीडिंग, यदि हों", "अपने सवालों की छोटी सूची"],
    doctorEyebrow: "आपके चिकित्सक", doctorTitle: "डॉ. कुलवंत यादव", doctorBody: "डॉ. यादव गोपीनाथ अस्पताल, भिवाड़ी में आंतरिक चिकित्सा सलाहकार हैं। वयस्क रोगों की देखभाल में वे मधुमेह के साथ रक्तचाप, गुर्दों, यकृत और अन्य समस्याओं को भी देखते हैं और ज़रूरत पर दूसरे विशेषज्ञों से समन्वय करते हैं।", doctorLink: "उनकी सत्यापित प्रोफ़ाइल पढ़ें",
    appointmentEyebrow: "08 / संपर्क करें", appointmentTitle: "मधुमेह परामर्श का अनुरोध करें।", appointmentBody: "उपलब्ध समय पूछने के लिए क्लिनिक को कॉल करें या तैयार व्हाट्सऐप संदेश भेजें। अनुरोध का मतलब अपॉइंटमेंट पक्का होना नहीं है; आने से पहले क्लिनिक की पुष्टि लें।", appointmentNote: "वेबसाइट का सामान्य ऑनलाइन अपॉइंटमेंट फ़ॉर्म अभी केवल नमूना है और अनुरोध नहीं भेजता। वास्तविक अनुरोध के लिए कॉल या व्हाट्सऐप करें।", privacy: "पहले संदेश में रिपोर्ट या विस्तृत चिकित्सा जानकारी न भेजें। क्लिनिक निजी तरीके से जानकारी साझा करने की सलाह दे सकता है।",
    locationEyebrow: "भिवाड़ी में मिलें", locationTitle: "क्लिनिक का स्थान", address: "एच-226, इंडस्ट्रियल एरिया, रामफल सिनेमा के पास, भिवाड़ी, राजस्थान 301019", hours: "नियमित परामर्श का समय ऑनलाइन सत्यापित नहीं है। आने से पहले कॉल करें।",
    faqEyebrow: "सीधे जवाब", faqTitle: "अक्सर पूछे जाने वाले सवाल", faqs: [
      ["क्या मधुमेह बिना लक्षणों के हो सकता है?", "हाँ। टाइप 2 मधुमेह धीरे-धीरे बिना स्पष्ट लक्षणों के बढ़ सकता है। जोखिम के आधार पर जाँच ज़रूरी हो सकती है।"],
      ["प्रीडायबिटीज़ और मधुमेह में क्या अंतर है?", "प्रीडायबिटीज़ में शर्करा सामान्य से ऊपर होती है लेकिन मधुमेह की निदान-सीमा से नीचे। डॉक्टर रिपोर्ट समझकर पुष्टि की ज़रूरत तय करेंगे।"],
      ["HbA1c क्या बताती है?", "यह लगभग तीन महीनों की औसत रक्त शर्करा का अनुमान देती है। कुछ स्थितियों में यह कम भरोसेमंद होती है; डॉक्टर दूसरी जाँच चुन सकते हैं।"],
      ["क्या एक अधिक रीडिंग से मधुमेह की पुष्टि हो जाती है?", "आमतौर पर नहीं। स्पष्ट लक्षण या ग्लूकोज़ संबंधी आपातस्थिति न हो तो पुष्टि के लिए प्रयोगशाला जाँच चाहिए होती है।"],
      ["क्या मधुमेह ठीक हो सकता है या रिमिशन में जा सकता है?", "टाइप 2 वाले कुछ लोग रिमिशन में जा सकते हैं, लेकिन यह स्थायी इलाज की गारंटी नहीं है। निगरानी जारी रहती है। टाइप 1 में इंसुलिन ज़रूरी है।"],
      ["क्या सभी को इंसुलिन चाहिए?", "नहीं। इलाज मधुमेह के प्रकार और व्यक्तिगत ज़रूरत पर निर्भर करता है। टाइप 1 में इंसुलिन ज़रूरी है; टाइप 2 में भी कुछ लोगों को इसकी आवश्यकता हो सकती है।"],
      ["क्या मैं चावल, रोटी और फल खा सकता/सकती हूँ?", "अक्सर हाँ, अपनी योजना के अनुरूप मात्रा में। जूस के बजाय पूरा फल बेहतर हो सकता है। कम शर्करा कराने वाली दवाएँ हों तो भोजन का समय पूछें।"],
      ["रक्त शर्करा कितनी बार जाँचनी चाहिए?", "यह इलाज, कम शर्करा के जोखिम और जाँच के उद्देश्य पर निर्भर करता है। डॉक्टर से व्यक्तिगत समय-सारणी लें।"],
      ["क्या मधुमेह और उच्च रक्तचाप का इलाज साथ हो सकता है?", "हाँ। दोनों दिल और गुर्दों के जोखिम से जुड़े हैं, इसलिए समन्वित योजना उपयोगी है।"],
      ["अपॉइंटमेंट पर क्या लाऊँ?", "पुराने पर्चे, दवाएँ, हाल की रिपोर्ट, घर की रीडिंग यदि हों, और अपने सवाल साथ लाएँ।"],
    ],
    urgentTitle: "चेतावनी के लक्षणों पर तुरंत इलाज लें", urgentBody: "भ्रम, बेहोशी, लगातार उल्टी, गहरी तेज़ साँस, बहुत अधिक पानी की कमी या कम रक्त शर्करा का न सुधरना—इनमें तुरंत चिकित्सकीय मूल्यांकन चाहिए। नियमित अपॉइंटमेंट का इंतज़ार न करें; आपातकालीन सेवा लें।",
    sourcesIntro: "चिकित्सा जानकारी नीचे दिए गए विश्वसनीय स्रोतों पर आधारित है। इसे अलग से डॉ. यादव द्वारा समीक्षा-प्राप्त नहीं बताया गया है।", sourceNames: ["NIDDK — मधुमेह की जाँच और निदान", "NIDDK — मधुमेह के साथ स्वस्थ जीवन", "NIDDK — लक्षण और कारण", "WHO — मधुमेह तथ्य-पत्र", "ADA — 2026 निदान और वर्गीकरण मानक", "NIDDK — टाइप 2 मधुमेह में रिमिशन"], disclaimer: "चिकित्सा अस्वीकरण: यह पेज सामान्य जानकारी देता है, निदान या व्यक्तिगत इलाज की योजना नहीं। अपने लक्षणों, रिपोर्ट और इलाज के निर्णयों पर योग्य चिकित्सक से बात करें।",
  },
} as const;

const sources = [
  "https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis",
  "https://www.niddk.nih.gov/health-information/diabetes/overview/healthy-living-with-diabetes",
  "https://www.niddk.nih.gov/health-information/diabetes/overview/symptoms-causes",
  "https://www.who.int/news-room/fact-sheets/detail/diabetes",
  "https://diabetesjournals.org/care/article/49/Supplement_1/S27/163926/2-Diagnosis-and-Classification-of-Diabetes",
  "https://www.niddk.nih.gov/health-information/professionals/diabetes-discoveries-practice/achieving-type-2-diabetes-remission-through-weight-loss",
];

const numberIcons = [Droplets, Activity, HeartPulse, HeartPulse, ShieldCheck];
const protectIcons = [HeartPulse, ShieldCheck, Eye, Footprints, Leaf];

export default function DiabetesPage() {
  const [language, setLanguage] = useState<Language>("en");
  const t = copy[language];
  useEffect(() => {
    document.documentElement.lang = language === "hi" ? "hi-IN" : "en-IN";
    return () => { document.documentElement.lang = "en-IN"; };
  }, [language]);

  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cards = document.querySelectorAll<HTMLElement>(
      '.diabetes-page .diabetes-two-columns article, .diabetes-page .diabetes-pillar-grid article, .diabetes-page .diabetes-protect-grid article, .diabetes-page .diabetes-remission, .diabetes-page .diabetes-journey aside, .diabetes-page .diabetes-plate, .diabetes-page .diabetes-hero-card'
    );
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('diabetes-card-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    cards.forEach((card) => observer.observe(card));
    document.querySelector('.diabetes-page')?.classList.add('diabetes-motion-ready');
    return () => {
      observer.disconnect();
      document.querySelector('.diabetes-page')?.classList.remove('diabetes-motion-ready');
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const stacks = document.querySelectorAll<HTMLElement>('.diabetes-page .diabetes-scroll-stack');
    let frame = 0;
    const updateStacks = () => {
      frame = 0;
      const headerHeight = document.querySelector<HTMLElement>('.diabetes-page .site-header')?.getBoundingClientRect().height ?? 88;
      const stickyTop = headerHeight + 18;
      stacks.forEach((stack) => {
        const cards = Array.from(stack.querySelectorAll<HTMLElement>('article'));
        cards.forEach((card, index) => {
          const nextCard = cards[index + 1];
          if (!nextCard) return;
          const distance = nextCard.getBoundingClientRect().top - stickyTop;
          const progress = Math.max(0, Math.min(1, 1 - distance / 260));
          card.style.setProperty('--db-stack-scale', (1 - progress * 0.055).toFixed(3));
          card.style.setProperty('--db-stack-brightness', (1 - progress * 0.07).toFixed(3));
        });
      });
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateStacks);
    };
    updateStacks();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      stacks.forEach((stack) => stack.querySelectorAll<HTMLElement>('article').forEach((card) => {
        card.style.removeProperty('--db-stack-scale');
        card.style.removeProperty('--db-stack-brightness');
      }));
    };
  }, []);

  const schema = [
    { "@context": "https://schema.org", "@type": "MedicalWebPage", name: "Diabetes Care in Bhiwadi", description: "Patient education about diabetes and ways to request a consultation with Dr. Kulwant Yadav.", url: `${siteUrl}/conditions/diabetes`, about: { "@type": "MedicalCondition", name: "Diabetes mellitus" }, mentions: { "@id": physicianId }, inLanguage: ["en-IN", "hi-IN"] },
    breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Conditions", path: "/conditions" }, { name: "Diabetes", path: "/conditions/diabetes" }]),
  ];

  return <main className="diabetes-page">
    <JsonLd data={schema} />
    <div className="info-strip"><span>{t.eyebrow}</span><strong>{t.emergencyStrip}</strong></div>
    <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">KY</span><span><strong>{language === "hi" ? "डॉ. कुलवंत यादव" : "Dr. Kulwant Yadav"}</strong><small>{t.doctorRole}</small></span></Link><nav aria-label={t.nav}><Link href="/conditions">{t.allConditions}</Link><Link href="/about-dr-kulwant-yadav">{t.about}</Link><Link href="/health-library">{t.library}</Link></nav><a className="header-cta" href={whatsapp} target="_blank" rel="noopener noreferrer">{t.book}</a><details className="diabetes-mobile-menu"><summary><span className="diabetes-menu-lines" aria-hidden="true"><span /><span /><span /></span><span className="diabetes-visually-hidden">{language === "hi" ? "वेबसाइट मेन्यू" : "Website menu"}</span></summary><nav aria-label={t.nav}><Link href="/">{language === "hi" ? "होम" : "Home"}</Link><Link href="/conditions">{t.allConditions}</Link><Link href="/about-dr-kulwant-yadav">{t.about}</Link><Link href="/health-library">{t.library}</Link><a href={whatsapp} target="_blank" rel="noopener noreferrer">{t.book}</a></nav></details></header>
    <div className="diabetes-language" role="group" aria-label={t.languages}><span>{t.languages}</span><button type="button" lang="en" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button><button type="button" lang="hi" aria-pressed={language === "hi"} onClick={() => setLanguage("hi")}>हिंदी</button></div>
    <section className="diabetes-hero"><div className="diabetes-hero-copy"><Link href="/conditions" className="diabetes-back">← {t.back}</Link><p className="diabetes-kicker">{t.eyebrow}</p><h1>{t.title}</h1><p className="diabetes-lead">{t.hero}</p><div className="diabetes-actions"><a className="diabetes-button" href={appointmentUrl}>{t.heroBook}<ArrowRight size={18} aria-hidden="true" /></a><a className="diabetes-text-button" href="#understand">{t.learn} ↓</a></div><div className="diabetes-doctor-line"><Stethoscope size={18} aria-hidden="true" /><span><strong>Dr. Kulwant Yadav</strong> · {t.doctorRole}<br />{t.hospital}</span></div></div><div className="diabetes-hero-visual"><Image src="/dr-kulwant-yadav-portrait.png" alt="Dr. Kulwant Yadav, Consultant in Internal Medicine" width={800} height={960} priority sizes="(max-width: 800px) 100vw, 42vw" /><div className="diabetes-hero-card"><span>+</span><strong>{t.heroCardTitle}</strong><p>{t.heroCardBody}</p></div></div></section>
    <nav className="diabetes-index" aria-label={t.nav}><strong>{t.nav}</strong><div>{t.sectionLinks.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</div></nav>

    <section className="diabetes-section" id="understand"><div className="diabetes-heading"><p className="diabetes-kicker">{t.understandEyebrow}</p><h2>{t.understandTitle}</h2><p>{t.understandIntro}</p></div><div className="diabetes-type-grid diabetes-scroll-stack">{t.types.map(([title, body], i) => <article key={title} style={{ zIndex: i + 1 }}><span>0{i + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div><p className="diabetes-note">{t.typesNote}</p></section>

    <section className="diabetes-section diabetes-tinted" id="symptoms"><div className="diabetes-heading"><p className="diabetes-kicker">{t.symptomsEyebrow}</p><h2>{t.symptomsTitle}</h2><p>{t.symptomsIntro}</p></div><div className="diabetes-two-columns"><article><h3>{t.symptomsLabel}</h3><ul>{t.symptoms.map(item => <li key={item}>{item}</li>)}</ul></article><article><h3>{t.riskLabel}</h3><ul>{t.risks.map(item => <li key={item}>{item}</li>)}</ul></article></div><p className="diabetes-note">{t.symptomsFoot}</p></section>

    <section className="diabetes-section" id="numbers"><div className="diabetes-heading"><p className="diabetes-kicker">{t.numbersEyebrow}</p><h2>{t.numbersTitle}</h2><p>{t.numbersIntro}</p></div><div className="diabetes-number-grid diabetes-scroll-stack">{t.numbers.map(([title, body], i) => { const Icon = numberIcons[i]; return <article key={title} style={{ zIndex: i + 1 }}><Icon size={27} strokeWidth={1.7} aria-hidden="true" /><h3>{title}</h3><p>{body}</p></article>; })}</div><p className="diabetes-note">{t.numbersFoot}</p><a className="diabetes-button" href={whatsapp} target="_blank" rel="noopener noreferrer">{t.discuss}<ArrowRight size={18} aria-hidden="true" /></a></section>

    <section className="diabetes-section diabetes-dark" id="management"><div className="diabetes-heading"><p className="diabetes-kicker">{t.managementEyebrow}</p><h2>{t.managementTitle}</h2><p>{t.managementIntro}</p></div><div className="diabetes-pillar-grid">{t.pillars.map(([title, body], i) => <article key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div><div className="diabetes-remission"><p className="diabetes-kicker">{t.cureEyebrow}</p><h3>{t.cureTitle}</h3><p>{t.cureBody}</p></div></section>

    <section className="diabetes-section diabetes-food" id="food"><div className="diabetes-heading"><p className="diabetes-kicker">{t.foodEyebrow}</p><h2>{t.foodTitle}</h2><p>{t.foodIntro}</p></div><div className="diabetes-food-layout"><div className="diabetes-plate" role="img" aria-label={`${t.plateHalfText}; ${t.plateQuarterText}; ${t.plateCarbText}`}><Image className="diabetes-plate-photo" src="/diabetes-balanced-indian-plate.png" alt="" fill sizes="(max-width: 600px) 90vw, 540px" /><div className="diabetes-plate-half"><span>{t.plateHalf}</span><strong>{t.plateHalfText}</strong></div><div className="diabetes-plate-quarters"><div><span>{t.plateQuarter}</span><strong>{t.plateQuarterText}</strong></div><div><span>{t.plateCarb}</span><strong>{t.plateCarbText}</strong></div></div></div><div className="diabetes-food-copy"><strong>{t.plateLabel}</strong><p>{t.foodNote}</p></div></div></section>

    <section className="diabetes-section diabetes-tinted" id="protect"><div className="diabetes-heading"><p className="diabetes-kicker">{t.protectEyebrow}</p><h2>{t.protectTitle}</h2><p>{t.protectIntro}</p></div><div className="diabetes-protect-grid">{t.protect.map(([title, body, href, label], i) => { const Icon = protectIcons[i]; return <article key={title}><Icon size={27} strokeWidth={1.6} aria-hidden="true" /><h3>{title}</h3><p>{body}</p><Link href={href}>{label} <ArrowUpRight size={15} aria-hidden="true" /></Link></article>; })}</div></section>

    <section className="diabetes-section diabetes-journey" id="consultation"><div><p className="diabetes-kicker">{t.journeyEyebrow}</p><h2>{t.journeyTitle}</h2><p>{t.journeyIntro}</p><ol>{t.journey.map((item, i) => <li key={item}><span>{String(i + 1).padStart(2, "0")}</span>{item}</li>)}</ol></div><aside><h3>{t.bringTitle}</h3><ul>{t.bring.map(item => <li key={item}>{item}</li>)}</ul></aside></section>

    <section className="diabetes-section diabetes-faq" id="faqs"><div className="diabetes-heading"><p className="diabetes-kicker">{t.faqEyebrow}</p><h2>{t.faqTitle}</h2></div><div>{t.faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    <aside className="diabetes-urgent" role="note"><HeartPulse size={27} aria-hidden="true" /><div><h2>{t.urgentTitle}</h2><p>{t.urgentBody}</p></div></aside>
    <section className="diabetes-section diabetes-sources"><p className="diabetes-kicker">{t.sourceLabel}</p><p>{t.sourcesIntro}</p><ul>{sources.map((href, i) => <li key={href}><a href={href} target="_blank" rel="noopener noreferrer">{t.sourceNames[i]} ↗</a></li>)}</ul><p className="diabetes-disclaimer">{t.disclaimer}</p></section>
    <SiteFooter reviewed={false} language={language} />
    <nav className="diabetes-mobile-actions" aria-label={t.book}><a href={whatsapp} target="_blank" rel="noopener noreferrer">{t.book}</a><a href={whatsapp} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a><a href={phone}>{t.call}</a></nav>
  </main>;
}
