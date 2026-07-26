export type LibraryTopic={
  slug:string; title:string; category:string; summary:string; readTime:string;
  introduction:string; keyPoints:string[];
  sections:{heading:string;paragraphs:string[];bullets?:string[]}[];
  urgent:string[];
};

export const libraryTopics:LibraryTopic[]=[
  {
    slug:"diabetes-when-to-consult-a-physician",
    title:"When should a person with diabetes consult a physician?",
    category:"Diabetes & metabolism",readTime:"6 min read",
    summary:"A practical guide to routine reviews, changing symptoms, medicine concerns and warning signs that need urgent care.",
    introduction:"Diabetes care is not only about a single glucose reading. Regular review helps connect day-to-day readings with medicines, nutrition, kidney health, eye health, nerve symptoms and long-term cardiovascular risk.",
    keyPoints:["Review patterns rather than reacting to one isolated reading.","Bring your glucose record and current medicine list to the consultation.","New or severe symptoms may require urgent assessment."],
    sections:[
      {heading:"Plan a routine review",paragraphs:["Arrange a review when readings repeatedly remain above or below the target agreed with your clinician, when your treatment plan has changed, or when it is time to reassess long-term risk.","Routine visits may include blood pressure, weight, HbA1c, kidney tests, cholesterol review, foot assessment and discussion of eye screening."],bullets:["Glucose readings remain outside your target range","You are due for HbA1c or complication screening","Your diet, activity, weight or daily routine has changed"]},
      {heading:"Speak to a doctor when symptoms change",paragraphs:["Increased thirst, frequent urination, unexplained weight change, recurrent infections, blurred vision, unusual fatigue, numbness or tingling deserve clinical review. These symptoms are not specific to diabetes, so assessment should consider the whole picture."]},
      {heading:"Discuss medicines early",paragraphs:["Do not stop or alter prescribed diabetes medicines without clinical advice. Contact your clinician if you experience repeated low readings, vomiting, dehydration, medicine side effects, difficulty following the schedule or uncertainty during another illness."],bullets:["Carry an up-to-date medicine list","Mention supplements and non-prescription medicines","Ask for a clear sick-day plan"]}
    ],
    urgent:["Confusion, marked drowsiness or loss of consciousness","Severe vomiting, dehydration or inability to keep fluids down","Deep or difficult breathing, severe weakness or rapidly worsening illness"]
  },
  {
    slug:"fatty-liver-and-metabolic-health",
    title:"What fatty liver means for your metabolic health",
    category:"Liver & digestive health",readTime:"7 min read",
    summary:"Understand how fatty liver may connect with weight, blood sugar, cholesterol and cardiovascular health.",
    introduction:"Fatty liver—often called metabolic dysfunction-associated steatotic liver disease (MASLD)—can be an early sign that liver health and the wider metabolic picture are connected.",
    keyPoints:["Fatty liver often occurs alongside insulin resistance and excess weight.","Normal symptoms do not rule out liver inflammation or scarring.","Assessment focuses on both liver risk and the conditions driving it."],
    sections:[
      {heading:"Why the finding matters",paragraphs:["Fat in the liver may be discovered on an ultrasound or during blood tests performed for another reason. Many people feel well, but the finding can still be useful because it prompts a structured review of metabolic and cardiovascular risk."]},
      {heading:"What a medical assessment may include",paragraphs:["A clinician may review alcohol intake, medicines, weight history, diabetes risk, cholesterol, blood pressure and possible alternative causes of abnormal liver tests."],bullets:["Liver function tests and a complete metabolic profile","Ultrasound or other imaging when appropriate","A non-invasive fibrosis risk calculation or specialist referral when indicated"]},
      {heading:"Building a practical plan",paragraphs:["Management usually focuses on gradual, sustainable change rather than a short restrictive programme. The right plan depends on current weight, diabetes status, heart risk, liver fibrosis risk and other health conditions."],bullets:["A realistic nutrition and activity plan","Treatment of diabetes, cholesterol and blood pressure","Follow-up testing based on individual risk"]}
    ],
    urgent:["Yellowing of the eyes or skin","Vomiting blood, black stools or a rapidly enlarging abdomen","New confusion, severe weakness or intense abdominal pain"]
  },
  {
    slug:"high-blood-pressure-urgent-warning-signs",
    title:"When high blood pressure needs urgent medical attention",
    category:"Heart & circulation",readTime:"5 min read",
    summary:"Learn how to repeat a reading correctly, when to contact a doctor and which symptoms should never wait.",
    introduction:"A high blood pressure reading can be alarming, but the number must be interpreted alongside symptoms, measurement technique, usual readings, medicines and other health conditions.",
    keyPoints:["Sit quietly and repeat an unexpected reading correctly.","Keep a record rather than relying on memory.","Very high blood pressure with serious symptoms is an emergency."],
    sections:[
      {heading:"Check the reading correctly",paragraphs:["Rest for about five minutes, sit with your back supported and feet flat, place the cuff on a bare upper arm at heart level, and avoid talking during the measurement. Repeat the reading after a short interval."],bullets:["Use a validated upper-arm monitor and the correct cuff size","Avoid exercise, caffeine and smoking shortly before measuring","Record the date, time and both readings"]},
      {heading:"When to arrange a consultation",paragraphs:["Book a review when home readings repeatedly remain above your agreed target, when readings change from their usual pattern or when you experience possible medicine side effects.","A consultation may review measurement technique, lifestyle, medicines, kidney function, diabetes and overall cardiovascular risk."]},
      {heading:"Do not change treatment alone",paragraphs:["Missing doses or suddenly stopping some blood pressure medicines can cause problems. If a reading is unexpectedly high or low, seek advice about the next step instead of doubling, skipping or stopping treatment without guidance."]}
    ],
    urgent:["Chest pain, severe breathlessness or fainting","New weakness, facial droop, difficulty speaking or confusion","Sudden severe headache, seizure or loss of vision"]
  }
];

export function getLibraryTopic(slug:string){return libraryTopics.find(topic=>topic.slug===slug)}
