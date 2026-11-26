const headacheExample = {
  prompt: 'Matha betha korse',
  reply: `আপনার মাথাব্যথার কথা জানতে পেরে দুঃখিত হলাম।
সঠিক পরামর্শ দেওয়ার জন্য নিচের দুটি বিষয় একটু জানাবেন:
১. আপনার এই মাথাব্যথা কতদিন ধরে হচ্ছে এবং এটি কি মাথার কোনো নির্দিষ্ট একপাশে বেশি অনুভূত হয়?
২. ব্যথার সাথে আপনার কি বমি বমি ভাব, চোখে ঝাপসা দেখা বা জ্বরের মতো কোনো লক্ষণ আছে?`
};

const cardiologyExample = {
  prompt: 'Cardiology doctor book korbo',
  heading: 'অনুবটে ডাক্তার বুক করুন',
  introduction: 'ডাক্তার খোঁজার অভিজ্ঞতা দেখুন—নিচের ৩টি প্রোফাইল কেবল নমুনা। বর্তমান ডাক্তার তালিকা অ্যাপে দেখুন।',
  doctors: [
    { name: 'Prof. Dr. Mahim Khan', qualifications: 'MBBS · Cardiology', fee: '৳৩০০', avatar: 'mahim' },
    { name: 'Prof. Dr. Sifat', qualifications: 'BDS, MD, MS · Cardiology', fee: '৳১০০০', avatar: 'sifat' },
    { name: 'Prof. Dr. Sk', qualifications: 'BDS, FCPS, MCPS · Cardiology', fee: '৳৫০০', avatar: 'sk' }
  ]
};
cardiologyExample.reply = [
  cardiologyExample.heading,
  cardiologyExample.introduction,
  '| ডাক্তারের নাম | ডিগ্রি ও বিশেষজ্ঞতা | কনসালটেশন ফি | অ্যাকশন |',
  '|---|---|---|---|',
  ...cardiologyExample.doctors.map(doctor => `| ${doctor.name} | ${doctor.qualifications} | ${doctor.fee} | [Make Appointment] |`)
].join('\n');

const normalizeExamplePrompt = input => String(input ?? '').trim().toLowerCase().replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
export function getDemoExample(input) {
  const question = normalizeExamplePrompt(input);
  return [headacheExample, cardiologyExample].find(example => normalizeExamplePrompt(example.prompt) === question) ?? null;
}

export function getInitialDemoConversation({ compact = false } = {}) {
  const examples = compact ? [
    { ...headacheExample, reply: 'আপনার মাথাব্যথার কথা জানতে পেরে দুঃখিত হলাম।\nকতদিন ধরে ব্যথা হচ্ছে? সঙ্গে কি বমি বমি ভাব, ঝাপসা দেখা বা জ্বর আছে?' },
    { ...cardiologyExample, introduction: 'অনুবটে কার্ডিওলজি ডাক্তার খোঁজার একটি নমুনা:', doctors: cardiologyExample.doctors.slice(0,1), compact: true }
  ] : [headacheExample, cardiologyExample];
  return examples.flatMap((example, index) => [
    { role: 'user', text: example.prompt },
    { role: 'assistant', text: example.reply, example, showAppCard: !compact || index === examples.length - 1 }
  ]);
}

export function getDemoReply(input) {
  const question = String(input ?? '').trim();
  if (!question) return null;
  const example = getDemoExample(question);
  if (example) return example.reply;
  const bangla = /[\u0980-\u09ff]/.test(question);
  if (bangla) {
    if (/ডোজ|সিরাপ|বাচ্চা|জ্বর|ওষুধ|খাবার/.test(question)) {
      return 'ওষুধের ডোজের জন্য চিকিৎসক বা ফার্মাসিস্টের সঙ্গে কথা বলুন। অনূবট অ্যাপটি দেখতে নিচের কার্ডে চাপুন।';
    }
    return 'হ্যালো! অনূবটের সঙ্গে আপনার স্বাস্থ্যযাত্রা একটু সহজ হোক। অ্যাপটি দেখতে নিচের কার্ডে চাপুন।';
  }
  if (/prescription|scan|handwrit/i.test(question)) {
    return 'Onubot helps you scan and review prescriptions. You can explore it with the app card below.';
  }
  if (/doctor|book|consult|appointment/i.test(question)) {
    return 'You can explore doctors and appointment options in Onubot. Tap the app card below to get started.';
  }
  if (/dose|dosage|medicine|fever|child|antibiotic|napa|azithromycin/i.test(question)) {
    return 'Please confirm medicine doses with your doctor or pharmacist. You can explore Onubot with the app card below.';
  }
  return 'Hi! Thanks for stopping by. Take a look at Onubot using the app card below.';
}
